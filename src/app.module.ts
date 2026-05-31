import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { EmailModule } from "./email/email.module";
import { CustomersModule } from "./customers/customers.module";
import { ExtinguishersModule } from "./extinguishers/extinguishers.module";
import { SettingsModule } from "./settings/settings.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ExpirySchedulerModule } from "./expiry-scheduler/expiry-scheduler.module";

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    SettingsModule,
    ExtinguishersModule,
    NotificationsModule,
    ExpirySchedulerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
