import { Module } from "@nestjs/common";

import { AuthGatewayModule } from "../auth/auth.gateway.module";
import { UsersGatewayController } from "./users.gateway.controller";

@Module({
  imports: [AuthGatewayModule],
  controllers: [UsersGatewayController],
})
export class UsersGatewayModule {}
