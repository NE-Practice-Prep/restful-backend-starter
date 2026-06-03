import { Module } from "@nestjs/common";

import { InspectionsMicroserviceController } from "./inspections.microservice.controller";
import { InspectionsService } from "./inspections.service";

@Module({
  controllers: [InspectionsMicroserviceController],
  providers: [InspectionsService],
})
export class InspectionsModule {}
