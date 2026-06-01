import { Module } from "@nestjs/common";

import { MicroservicesModule } from "../clients/microservices.module";
import { AuthGatewayModule } from "../auth/auth.gateway.module";
import { UsersGatewayController } from "./users.gateway.controller";

@Module({
  imports: [AuthGatewayModule, MicroservicesModule],
  controllers: [UsersGatewayController],
})
export class UsersGatewayModule {}
