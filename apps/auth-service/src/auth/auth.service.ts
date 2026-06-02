import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes, randomInt } from "node:crypto";
import * as bcrypt from "bcrypt";

import { PrismaService } from "@shared/prisma/prisma.service";
import { Role } from "@shared/common/enums/role.enum";
import { UserStatus } from "@shared/common/enums/user-status.enum";
import { EmailService } from "@shared/email/email.service";
import { toCurrentUser, type DbUser } from "@shared/common/mappers/user.mapper";
import type { ChangePasswordDto } from "@shared/dto/change-password.dto";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { VerifyResetPasswordDto } from "./dto/verify-reset-password.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { JwtPayload } from "./jwt-payload.type";

const DEFAULT_EXPIRES_SECONDS = 3600;
const REMEMBER_ME_EXPIRES_SECONDS = 30 * 24 * 3600;
const RESET_CODE_EXPIRES_MS = 15 * 60 * 1000;
const RESET_TOKEN_EXPIRES_MS = 15 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, password reset instructions have been sent";
const ACCOUNT_NOT_FOUND_MESSAGE = "No account exists for this email. Please create an account first.";

function maybeExposeVerificationCode(code: string, delivered: boolean) {
  if (delivered || process.env.NODE_ENV === "production") {
    return {};
  }

  return { devVerificationCode: code };
}

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

    const { delivered } = await this.email.sendVerificationCode(user.email, verificationCode);

    return {
      ...(await this.buildAuthResponse(user, DEFAULT_EXPIRES_SECONDS)),
      ...maybeExposeVerificationCode(verificationCode, delivered),
    };
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const emailAddress = dto.email.trim();
    const user = await this.prisma.user.findUnique({
      where: { email: emailAddress },
      select: { id: true, email: true, status: true, emailVerificationCode: true },
    });

    if (!user) {
      throw new NotFoundException(ACCOUNT_NOT_FOUND_MESSAGE);
    }

    if (user.status === UserStatus.suspended) {
      return { ok: true, message: GENERIC_RESET_MESSAGE };
    }

    const resetCode = this.generateOtpCode(user.emailVerificationCode);
    const resetExpires = new Date(Date.now() + RESET_CODE_EXPIRES_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCode: resetCode,
        passwordResetExpiresAt: resetExpires,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      },
    });

    await this.email.sendPasswordResetCode(user.email, resetCode);

    return {
      ok: true,
      message: GENERIC_RESET_MESSAGE,
      ...(this.shouldExposeDevCodes() ? { devResetCode: resetCode } : {}),
    };
  }

  async verifyResetPassword(dto: VerifyResetPasswordDto) {
    const emailAddress = dto.email.trim();
    const resetCode = dto.code.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: emailAddress },
      select: {
        id: true,
        passwordResetCode: true,
        passwordResetExpiresAt: true,
      },
    });

    if (
      !user ||
      !user.passwordResetCode ||
      user.passwordResetCode !== resetCode ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset code");
    }

    const resetToken = this.generateResetToken();
    const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCode: null,
        passwordResetExpiresAt: null,
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: resetTokenExpires,
      },
    });

    return { ok: true, resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const emailAddress = dto.email.trim();
    const resetToken = dto.token.trim();

    if (!resetToken) {
      throw new BadRequestException("Reset session is required");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: emailAddress },
      select: {
        id: true,
        passwordResetToken: true,
        passwordResetTokenExpiresAt: true,
      },
    });

    if (
      !user ||
      !user.passwordResetToken ||
      user.passwordResetToken !== resetToken ||
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset session");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordResetCode: null,
        passwordResetExpiresAt: null,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      },
    });

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

    const { delivered } = await this.email.sendVerificationCode(user.email, verificationCode);

    return { ok: true, ...maybeExposeVerificationCode(verificationCode, delivered) };
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
    return this.generateOtpCode();
  }

  private generateOtpCode(disallowedCode?: string | null): string {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = String(randomInt(100000, 1000000));
      if (!disallowedCode || code !== disallowedCode) return code;
    }

    return String((Number(disallowedCode) + 1) % 900000).padStart(6, "0");
  }

  private generateResetToken(): string {
    return randomBytes(32).toString("hex");
  }

  private shouldExposeDevCodes(): boolean {
    return process.env.NODE_ENV !== "production";
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
