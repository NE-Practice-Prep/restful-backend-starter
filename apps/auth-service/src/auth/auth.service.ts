import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { PrismaService } from "@shared/prisma/prisma.service";
import { Role } from "@shared/common/enums/role.enum";
import { UserStatus } from "@shared/common/enums/user-status.enum";
import {
  issuePasswordResetOtp,
  PASSWORD_RESET_OTP_TTL_MS,
} from "@shared/auth/issue-password-reset-otp";
import { EmailService } from "@shared/email/email.service";
import { toCurrentUser, type DbUser } from "@shared/common/mappers/user.mapper";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { JwtPayload } from "./jwt-payload.type";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import type { ChangePasswordDto } from "@shared/dto/change-password.dto";
import type { RequestPasswordResetDto } from "@shared/dto/request-password-reset.dto";
import type { ResendPasswordResetDto } from "@shared/dto/resend-password-reset.dto";
import type { VerifyPasswordResetOtpDto } from "@shared/dto/verify-password-reset-otp.dto";
import type { ResetPasswordDto } from "@shared/dto/reset-password.dto";
const DEFAULT_EXPIRES_SECONDS = 3600;
const REMEMBER_ME_EXPIRES_SECONDS = 30 * 24 * 3600;
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    this.logger.log(`Registration attempt for ${dto.email}`);
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.logger.warn(`Registration rejected ΓÇö email already registered: ${dto.email}`);
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        passwordHash,
        role: Role.user,
        status: UserStatus.invited,
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpiresAt: verificationExpires,
      },
      select: this.profileSelect,
    });

    await this.email.sendVerificationCode(user.email, verificationCode);
    this.logger.log(`User registered: ${user.id} (${user.email})`);

    return this.buildAuthResponse(user, DEFAULT_EXPIRES_SECONDS);
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for ${dto.email}`);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...this.profileSelect, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      this.logger.warn(`Login failed ΓÇö invalid credentials: ${dto.email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.suspended) {
      this.logger.warn(`Login blocked ΓÇö account suspended: ${dto.email}`);
      throw new ForbiddenException("Account suspended");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      this.logger.warn(`Login failed ΓÇö invalid credentials: ${dto.email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    const expiresIn = dto.rememberMe ? REMEMBER_ME_EXPIRES_SECONDS : DEFAULT_EXPIRES_SECONDS;
    const { passwordHash: _, ...profile } = user;
    this.logger.log(`Login successful: ${user.id} (${user.email})`);
    return this.buildAuthResponse(profile, expiresIn);
  }

  async logout() {
    this.logger.debug("Logout requested");
    return { ok: true };
  }

  async verifyEmail(currentUser: AuthenticatedUser, code: string) {
    this.logger.log(`Email verification attempt for user ${currentUser.sub}`);
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
      this.logger.debug(`Email already verified for user ${currentUser.sub}`);
      return { ok: true, emailVerified: true };
    }

    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      this.logger.warn(`Invalid or expired verification code for user ${currentUser.sub}`);
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

    this.logger.log(`Email verified for user ${currentUser.sub}`);
    return {
      ok: true,
      emailVerified: true,
      user: toCurrentUser(updated),
    };
  }

  async resendVerification(currentUser: AuthenticatedUser) {
    this.logger.log(`Resend verification requested for user ${currentUser.sub}`);
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { email: true, emailVerified: true },
    });

    if (!user) throw new UnauthorizedException();
    if (user.emailVerified) {
      return { ok: true, emailVerified: true };
    }

    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);

    await this.prisma.user.update({
      where: { id: currentUser.sub },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpiresAt: verificationExpires,
      },
    });

    await this.email.sendVerificationCode(user.email, verificationCode);
    this.logger.log(`Verification code resent to ${user.email}`);

    return { ok: true };
  }

  async changePassword(currentUser: AuthenticatedUser, dto: ChangePasswordDto) {
    this.logger.log(`Change password requested for user ${currentUser.sub}`);
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) throw new UnauthorizedException();

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      this.logger.warn(`Change password failed ΓÇö wrong current password: ${currentUser.sub}`);
      throw new UnauthorizedException("Current password is incorrect");
    }

    const sameAsCurrent = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (sameAsCurrent) {
      throw new BadRequestException("New password must be different from your current password");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    this.logger.log(`Password changed for user ${currentUser.sub}`);
    return { ok: true };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`Password reset requested for ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      this.logger.debug(`Password reset skipped ΓÇö no account for ${email}`);
      return { ok: true };
    }

    await issuePasswordResetOtp(this.prisma, user.id, user.email, {
      sendEmail: (to, code) => this.email.sendPasswordResetCode(to, code),
    });
    this.logger.log(`Password reset OTP issued for ${email}`);
    return { ok: true };
  }

  async resendPasswordReset(dto: ResendPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`Password reset OTP resend requested for ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      this.logger.debug(`Password reset resend skipped ΓÇö no account for ${email}`);
      return { ok: true };
    }

    await issuePasswordResetOtp(this.prisma, user.id, user.email, {
      sendEmail: (to, code) => this.email.sendPasswordResetCode(to, code),
    });
    this.logger.log(`Password reset OTP issued for ${email}`);
    return { ok: true };
  }

  async verifyPasswordResetOtp(dto: VerifyPasswordResetOtpDto) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`Password reset OTP verification for ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        passwordResetCode: true,
        passwordResetExpiresAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`Password reset OTP verification ΓÇö user not found: ${email}`);
      throw new NotFoundException("No account found for this email");
    }

    if (
      !user.passwordResetCode ||
      user.passwordResetCode !== dto.code ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      this.logger.warn(`Invalid or expired password reset OTP for ${email}`);
      throw new BadRequestException("Invalid or expired OTP");
    }

    this.logger.log(`Password reset OTP verified for ${email}`);
    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`Password reset completion for ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        passwordResetCode: true,
        passwordResetExpiresAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`Password reset ΓÇö user not found: ${email}`);
      throw new NotFoundException("No account found for this email");
    }

    if (
      !user.passwordResetCode ||
      user.passwordResetCode !== dto.code ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      this.logger.warn(`Password reset failed ΓÇö invalid or expired OTP for ${email}`);
      throw new BadRequestException("Invalid or expired OTP");
    }

    if (user.passwordHash) {
      const sameAsCurrent = await bcrypt.compare(dto.newPassword, user.passwordHash);
      if (sameAsCurrent) {
        throw new BadRequestException(
          "New password must be different from your current password",
        );
      }
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordResetCode: null,
        passwordResetExpiresAt: null,
      },
    });

    await Promise.all([
      this.email.sendPasswordResetSuccess(user.email),
      this.prisma.notification.create({
        data: {
          userId: user.id,
          type: "password_reset_completed",
          title: "Password changed",
          message: "Your password has been reset successfully.",
        },
      }),
    ]);

    this.logger.log(`Password reset completed for user ${user.id}`);
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
      firstName: true,
      lastName: true,
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
