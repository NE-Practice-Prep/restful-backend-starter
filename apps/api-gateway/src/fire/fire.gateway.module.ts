import { Module } from "@nestjs/common";

import { FireExtinguishersGatewayController } from "./fire-extinguishers.gateway.controller";
import { InspectionsGatewayController } from "./inspections.gateway.controller";
import { MaintenanceGatewayController } from "./maintenance.gateway.controller";
import { ComplianceGatewayController } from "./compliance.gateway.controller";
import { ReportsGatewayController } from "./reports.gateway.controller";

@Module({
  controllers: [
    FireExtinguishersGatewayController,
    InspectionsGatewayController,
    MaintenanceGatewayController,
    ComplianceGatewayController,
    ReportsGatewayController,
  ],
})
export class FireGatewayModule {}
