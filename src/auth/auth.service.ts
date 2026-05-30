import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../common/enums/role.enum";
import { UserStatus } from "../common/enums/user-status.enum";
import { EmailService } from "../email/email.service";
import { toCurrentUser, type DbUser } from "../common/mappers/user.mapper";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { JwtPayload } from "./jwt-payload.type";
import type { AuthenticatedUser } from "./types/authenticated-user.type";
import type { ChangePasswordDto } from "./dto/change-password.dto";

const DEFAULT_EXPIRES_SECONDS = 3600;
const REMEMBER_ME_EXPIRES_SECONDS = 30 * 24 * 3600;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.fullName.trim(),
        passwordHash,
        role: Role.viewer,
        status: UserStatus.invited,
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpiresAt: verificationExpires,
      },
      select: this.profileSelect,
    });

    await this.email.sendVerificationCode(user.email, verificationCode);

    return this.buildAuthResponse(user, DEFAULT_EXPIRES_SECONDS);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...this.profileSelect, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.suspended) {
      throw new ForbiddenException("Account suspended");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const expiresIn = dto.rememberMe ? REMEMBER_ME_EXPIRES_SECONDS : DEFAULT_EXPIRES_SECONDS;
    const { passwordHash: _, ...profile } = user;
    return this.buildAuthResponse(profile, expiresIn);
  }

  async logout() {
    return { ok: true };
  }

  async verifyEmail(currentUser: AuthenticatedUser, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: {
        emailVerified: true,
        emailVerificationCode: true,
        emailVerificationExpiresAt: true,
      },
    });

    if (!user) throw new UnauthorizedException();

    if (user.emailVerified) {
      return { ok: true, emailVerified: true };
    }

    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    const updated = await this.prisma.user.update({
      where: { id: currentUser.sub },
      data: {
        emailVerified: true,
        status: UserStatus.active,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
      select: this.profileSelect,
    });

    return {
      ok: true,
      emailVerified: true,
      user: toCurrentUser(updated),
    };
  }

  async resendVerification(currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { email: true, emailVerified: true },
    });

    if (!user) throw new UnauthorizedException();
    if (user.emailVerified) {
      return { ok: true, emailVerified: true };
    }

    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: currentUser.sub },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpiresAt: verificationExpires,
      },
    });

    await this.email.sendVerificationCode(user.email, verificationCode);

    return { ok: true };
  }

  async changePassword(currentUser: AuthenticatedUser, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) throw new UnauthorizedException();

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Current password is incorrect");

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return { ok: true };
  }

  async buildAuthResponse(user: DbUser, expiresInSeconds: number) {
    const token = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      } satisfies JwtPayload,
      { expiresIn: expiresInSeconds },
    );

    return {
      accessToken: token,
      expiresIn: expiresInSeconds,
      user: toCurrentUser(user),
      emailVerified: user.emailVerified,
    };
  }

  private generateVerificationCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  private get profileSelect() {
    return {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      phone: true,
      location: true,
      bio: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    } as const;
  }
}
