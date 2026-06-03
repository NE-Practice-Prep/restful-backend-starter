import { Module } from "@nestjs/common";

import { ReportingMicroserviceController } from "./reporting.microservice.controller";
import { ReportingService } from "./reporting.service";

@Module({
  controllers: [ReportingMicroserviceController],
  providers: [ReportingService],
})
export class ReportingModule {}
