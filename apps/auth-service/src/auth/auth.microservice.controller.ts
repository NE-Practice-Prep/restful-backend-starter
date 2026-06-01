import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { AUTH_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import type { ChangePasswordDto } from "@shared/dto/change-password.dto";
import { AuthService } from "./auth.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";

@Controller()
export class AuthMicroserviceController {
  constructor(private readonly auth: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.REGISTER)
  async register(@Payload() dto: RegisterDto) {
    try {
      return await this.auth.register(dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  async login(@Payload() dto: LoginDto) {
    try {
      return await this.auth.login(dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(AUTH_PATTERNS.LOGOUT)
  logout() {
    return this.auth.logout();
  }

  @MessagePattern(AUTH_PATTERNS.VERIFY_EMAIL)
  async verifyEmail(@Payload() data: { user: AuthenticatedUser; code: string }) {
    try {
      return await this.auth.verifyEmail(data.user, data.code);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(AUTH_PATTERNS.RESEND_VERIFICATION)
  async resendVerification(@Payload() data: { user: AuthenticatedUser }) {
    try {
      return await this.auth.resendVerification(data.user);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(AUTH_PATTERNS.CHANGE_PASSWORD)
  async changePassword(@Payload() data: { user: AuthenticatedUser; dto: ChangePasswordDto }) {
    try {
      return await this.auth.changePassword(data.user, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
