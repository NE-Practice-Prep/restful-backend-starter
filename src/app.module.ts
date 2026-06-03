import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { EmailModule } from "./email/email.module";

@Module({
  imports: [PrismaModule, EmailModule, AuthModule, UsersModule, NotificationsModule],
  controllers: [AppController],
})
export class AppModule {}
