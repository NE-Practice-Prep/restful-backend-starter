import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { EmailModule } from "@shared/email/email.module";
import { AuthModule } from "./auth/auth.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [PrismaModule, EmailModule, AuthModule, NotificationsModule],
})
export class AppModule {}
