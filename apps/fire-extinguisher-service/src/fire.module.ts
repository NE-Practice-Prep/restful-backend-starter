import { Module } from "@nestjs/common";

import { FireMicroserviceController } from "./fire.microservice.controller";
import { SitesMicroserviceController } from "./sites/sites.microservice.controller";
import { RequestsMicroserviceController } from "./requests/requests.microservice.controller";
import { ExtinguishersService } from "./extinguishers/extinguishers.service";
import { InspectionsService } from "./inspections/inspections.service";
import { MaintenanceService } from "./maintenance/maintenance.service";
import { ComplianceService } from "./compliance/compliance.service";
import { ReportsService } from "./reports/reports.service";
import { SitesService } from "./sites/sites.service";
import { RequestsService } from "./requests/requests.service";

@Module({
  controllers: [FireMicroserviceController, SitesMicroserviceController, RequestsMicroserviceController],
  providers: [
    ExtinguishersService,
    InspectionsService,
    MaintenanceService,
    ComplianceService,
    ReportsService,
    SitesService,
    RequestsService,
  ],
})
export class FireModule {}
