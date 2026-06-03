import { Module } from "@nestjs/common";

import { NotificationsMicroserviceController } from "./notifications.microservice.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [NotificationsMicroserviceController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
