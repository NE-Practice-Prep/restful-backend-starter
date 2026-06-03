import { Module } from "@nestjs/common";

import { MicroservicesModule } from "../clients/microservices.module";
import { AuthGatewayModule } from "../auth/auth.gateway.module";
import { InspectionsGatewayController } from "./inspections.gateway.controller";

@Module({
  imports: [AuthGatewayModule, MicroservicesModule],
  controllers: [InspectionsGatewayController],
})
export class InspectionsGatewayModule {}
