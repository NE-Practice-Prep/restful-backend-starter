import { Module } from "@nestjs/common";

import { CustomersModule } from "../customers/customers.module";
import { ExtinguishersModule } from "../extinguishers/extinguishers.module";
import { SettingsModule } from "../settings/settings.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [CustomersModule, ExtinguishersModule, SettingsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
