import { Module } from "@nestjs/common";

import { NotificationsModule } from "../notifications/notifications.module";
import { SettingsModule } from "../settings/settings.module";
import { ExpirySchedulerService } from "./expiry-scheduler.service";

@Module({
  imports: [SettingsModule, NotificationsModule],
  providers: [ExpirySchedulerService],
})
export class ExpirySchedulerModule {}
