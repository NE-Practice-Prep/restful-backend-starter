import { Module } from "@nestjs/common";

import { ExtinguishersMicroserviceController } from "./extinguishers.microservice.controller";
import { ExtinguishersService } from "./extinguishers.service";

@Module({
  controllers: [ExtinguishersMicroserviceController],
  providers: [ExtinguishersService],
})
export class ExtinguishersModule {}
