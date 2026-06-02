import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import type { AuthenticatedUser } from "./types/authenticated-user.type";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { VerifyPasswordResetOtpDto } from "./dto/verify-password-reset-otp.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { AuthTokenResponseDto } from "./dto/auth-token-response.dto";
import { OkResponseDto } from "../common/dto/ok-response.dto";
import { NotificationDto } from "../common/dto/notification.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @ApiOperation({ summary: "Register a new account" })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiConflictResponse({ description: "Email already registered" })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @ApiOperation({ summary: "Log in" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  @ApiForbiddenResponse({ description: "Email not verified or account suspended" })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiOperation({ summary: "Log out" })
  @ApiOkResponse({ type: OkResponseDto })
  @Post("logout")
  logout() {
    return this.auth.logout();
  }

  @ApiOperation({ summary: "Verify email with OTP code" })
  @ApiBearerAuth()
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Post("verify-email")
  verifyEmail(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(user, dto.code);
  }

  @ApiOperation({ summary: "Resend email verification code" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Post("resend-verification")
  resendVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.resendVerification(user);
  }

  @ApiOperation({ summary: "Request password reset OTP" })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiOkResponse({ type: OkResponseDto })
  @Post("forgot-password")
  forgotPassword(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto);
  }

  @ApiOperation({ summary: "Verify password reset OTP" })
  @ApiBody({ type: VerifyPasswordResetOtpDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiBadRequestResponse({ description: "Invalid or expired OTP" })
  @Post("verify-reset-otp")
  verifyResetOtp(@Body() dto: VerifyPasswordResetOtpDto) {
    return this.auth.verifyPasswordResetOtp(dto);
  }

  @ApiOperation({ summary: "Reset password using OTP" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiBadRequestResponse({ description: "Invalid or expired OTP" })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @ApiOperation({ summary: "List my recent system notifications" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationDto, isArray: true })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Get("notifications")
  notifications(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.listNotifications(user);
  }
}
