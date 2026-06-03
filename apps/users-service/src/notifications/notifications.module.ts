import { Module } from "@nestjs/common";

import { EmailModule } from "@shared/email/email.module";
import { ExpiryNotificationsService } from "./expiry-notifications.service";
import { NotificationsMicroserviceController } from "./notifications.microservice.controller";

@Module({
  imports: [EmailModule],
  controllers: [NotificationsMicroserviceController],
  providers: [ExpiryNotificationsService],
})
export class NotificationsModule {}
