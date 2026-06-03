import { Module } from "@nestjs/common";

import { MicroservicesModule } from "../clients/microservices.module";
import { AuthGatewayModule } from "../auth/auth.gateway.module";
import { ReportsGatewayController } from "./reports.gateway.controller";

@Module({
  imports: [AuthGatewayModule, MicroservicesModule],
  controllers: [ReportsGatewayController],
})
export class ReportsGatewayModule {}
