import { Module } from "@nestjs/common";

import { MicroservicesModule } from "../clients/microservices.module";
import { AuthGatewayModule } from "../auth/auth.gateway.module";
import { NotificationsGatewayController } from "./notifications.gateway.controller";

@Module({
  imports: [MicroservicesModule, AuthGatewayModule],
  controllers: [NotificationsGatewayController],
})
export class NotificationsGatewayModule {}
