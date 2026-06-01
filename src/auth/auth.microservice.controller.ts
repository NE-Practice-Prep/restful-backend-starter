import { Controller } from "@nestjs/common";
import { MessagePattern, Payload, RpcException } from "@nestjs/microservices";

import { AuthService } from "./auth.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { VerifyEmailDto } from "./dto/verify-email.dto";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { AuthenticatedUser } from "./types/authenticated-user.type";

@Controller()
export class AuthMicroserviceController {
  constructor(private readonly auth: AuthService) {}

  @MessagePattern("auth.register")
  async register(@Payload() dto: RegisterDto) {
    try {
      return await this.auth.register(dto);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Registration failed");
    }
  }

  @MessagePattern("auth.login")
  async login(@Payload() dto: LoginDto) {
    try {
      return await this.auth.login(dto);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Login failed");
    }
  }

  @MessagePattern("auth.logout")
  async logout() {
    return this.auth.logout();
  }

  @MessagePattern("auth.verify_email")
  async verifyEmail(@Payload() data: { user: AuthenticatedUser; dto: VerifyEmailDto }) {
    try {
      return await this.auth.verifyEmail(data.user, data.dto.code);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Email verification failed");
    }
  }

  @MessagePattern("auth.resend_verification")
  async resendVerification(@Payload() data: { user: AuthenticatedUser }) {
    try {
      return await this.auth.resendVerification(data.user);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Resend verification failed");
    }
  }

  @MessagePattern("auth.change_password")
  async changePassword(@Payload() data: { user: AuthenticatedUser; dto: ChangePasswordDto }) {
    try {
      return await this.auth.changePassword(data.user, data.dto);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Change password failed");
    }
  }
}
