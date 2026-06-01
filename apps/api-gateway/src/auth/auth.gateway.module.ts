import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { MicroservicesModule } from "../clients/microservices.module";
import { AuthGatewayController } from "./auth.gateway.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [
    MicroservicesModule,
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
  controllers: [AuthGatewayController],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthGatewayModule {}
