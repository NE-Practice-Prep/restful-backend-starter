import { Module } from "@nestjs/common";

import { ReportsMicroserviceController } from "./reports.microservice.controller";
import { ReportsService } from "./reports.service";

@Module({
  controllers: [ReportsMicroserviceController],
  providers: [ReportsService],
})
export class ReportsModule {}
