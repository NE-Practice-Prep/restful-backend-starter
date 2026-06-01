import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthMicroserviceController } from "./auth.microservice.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
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
  controllers: [AuthMicroserviceController],
  providers: [AuthService],
})
export class AuthModule {}
