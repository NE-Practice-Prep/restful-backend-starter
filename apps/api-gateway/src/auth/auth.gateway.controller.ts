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
import { AUTH_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { VerifyResetPasswordDto } from "./dto/verify-reset-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { AuthTokenResponseDto } from "./dto/auth-token-response.dto";
import { OkResponseDto } from "@shared/common/dto/ok-response.dto";

/** Public HTTP routes under /auth — each method forwards to auth-service via TCP */
@ApiTags("auth")
@Controller("auth")
export class AuthGatewayController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(MicroserviceProxyService)
    private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({
    summary: "Register a new User account (viewer only)",
    description:
      "Public signup. Does not accept a role field. Inspectors and administrators are created by an admin via POST /users.",
  })
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

  @ApiOperation({ summary: "Request password reset instructions" })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiNotFoundResponse({ description: "No account exists for this email. Create an account first." })
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.FORGOT_PASSWORD, dto);
  }

  @ApiOperation({ summary: "Verify password reset OTP code" })
  @ApiBody({ type: VerifyResetPasswordDto })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        resetToken: { type: "string", example: "reset-session-token" },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid or expired reset code" })
  @Post("verify-reset-password")
  verifyResetPassword(@Body() dto: VerifyResetPasswordDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.VERIFY_RESET_PASSWORD, dto);
  }

  @ApiOperation({ summary: "Reset password with a verified reset session token" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiBadRequestResponse({ description: "Invalid or expired reset session" })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.proxy.send(this.authClient, AUTH_PATTERNS.RESET_PASSWORD, dto);
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
}
