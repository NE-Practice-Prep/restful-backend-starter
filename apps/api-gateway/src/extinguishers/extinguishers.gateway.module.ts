import { Module } from "@nestjs/common";

import { MicroservicesModule } from "../clients/microservices.module";
import { AuthGatewayModule } from "../auth/auth.gateway.module";
import { ExtinguishersGatewayController } from "./extinguishers.gateway.controller";

@Module({
  imports: [AuthGatewayModule, MicroservicesModule],
  controllers: [ExtinguishersGatewayController],
})
export class ExtinguishersGatewayModule {}
