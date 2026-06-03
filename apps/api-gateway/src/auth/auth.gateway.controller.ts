import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { AUTH_PATTERNS } from "@shared/microservices/patterns";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { ResendPasswordResetDto } from "@shared/dto/resend-password-reset.dto";
import { ResetPasswordDto } from "@shared/dto/reset-password.dto";
import { AUTH_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { VerifyPasswordResetOtpDto } from "./dto/verify-password-reset-otp.dto";
import { AuthTokenResponseDto } from "./dto/auth-token-response.dto";
import { OkResponseDto } from "@shared/common/dto/ok-response.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthGatewayController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Register a new account" })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiConflictResponse({ description: "Email already registered" })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.REGISTER, dto);
  }

  @ApiOperation({ summary: "Log in" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  @ApiForbiddenResponse({ description: "Email not verified or account suspended" })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.LOGIN, dto);
  }

  @ApiOperation({ summary: "Log out" })
  @ApiOkResponse({ type: OkResponseDto })
  @Post("logout")
  logout() {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.LOGOUT, {});
  }

  @ApiOperation({ summary: "Verify email with OTP code" })
  @ApiBearerAuth()
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Post("verify-email")
  verifyEmail(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyEmailDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.VERIFY_EMAIL, {
      user,
      code: dto.code,
    });
  }

  @ApiOperation({ summary: "Resend email verification code" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Post("resend-verification")
  resendVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.RESEND_VERIFICATION, { user });
  }

  @ApiOperation({ summary: "Request password reset OTP" })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiOkResponse({ type: OkResponseDto })
  @Post("forgot-password")
  forgotPassword(@Body() dto: RequestPasswordResetDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.REQUEST_PASSWORD_RESET, dto);
  }

  @ApiOperation({ summary: "Resend password reset OTP" })
  @ApiBody({ type: ResendPasswordResetDto })
  @ApiOkResponse({ type: OkResponseDto })
  @Post("resend-reset-otp")
  resendResetOtp(@Body() dto: ResendPasswordResetDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.RESEND_PASSWORD_RESET, dto);
  }

  @ApiOperation({ summary: "Verify password reset OTP" })
  @ApiBody({ type: VerifyPasswordResetOtpDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiBadRequestResponse({ description: "Invalid or expired OTP" })
  @ApiNotFoundResponse({ description: "No account found for this email" })
  @Post("verify-reset-otp")
  verifyResetOtp(@Body() dto: VerifyPasswordResetOtpDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.VERIFY_PASSWORD_RESET_OTP, dto);
  }

  @ApiOperation({ summary: "Reset password using OTP" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiBadRequestResponse({ description: "Invalid or expired OTP, or same as current password" })
  @ApiNotFoundResponse({ description: "No account found for this email" })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.RESET_PASSWORD, dto);
  }
}
