import { Module } from "@nestjs/common";

import { FireMicroserviceController } from "./fire.microservice.controller";
import { ExtinguishersService } from "./extinguishers/extinguishers.service";
import { InspectionsService } from "./inspections/inspections.service";
import { MaintenanceService } from "./maintenance/maintenance.service";
import { ComplianceService } from "./compliance/compliance.service";
import { ReportsService } from "./reports/reports.service";

@Module({
  controllers: [FireMicroserviceController],
  providers: [
    ExtinguishersService,
    InspectionsService,
    MaintenanceService,
    ComplianceService,
    ReportsService,
  ],
})
export class FireModule {}
