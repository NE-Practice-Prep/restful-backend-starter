import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { EmailModule } from "@shared/email/email.module";
import { UsersModule } from "./users/users.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [PrismaModule, EmailModule, UsersModule, NotificationsModule],
})
export class AppModule {}
