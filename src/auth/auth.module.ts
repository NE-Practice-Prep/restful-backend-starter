import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthController } from "./auth.controller";
import { AuthMicroserviceController } from "./auth.microservice.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = (process.env.JWT_SECRET ?? "dev_change_me").trim();
        const expiresIn = (process.env.JWT_EXPIRES_IN ?? "3600s").trim();
        return {
          secret,
          signOptions: { expiresIn: expiresIn as `${number}s` },
        };
      },
    }),
  ],
  controllers: [AuthController, AuthMicroserviceController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService],
})
export class AuthModule {}

