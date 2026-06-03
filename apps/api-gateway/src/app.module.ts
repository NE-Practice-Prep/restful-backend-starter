import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { MicroservicesModule } from "./clients/microservices.module";
import { AppController } from "./app.controller";
import { AuthGatewayModule } from "./auth/auth.gateway.module";
import { UsersGatewayModule } from "./users/users.gateway.module";
import { NotificationsGatewayModule } from "./notifications/notifications.gateway.module";

@Module({
  imports: [
    PrismaModule,
    MicroservicesModule,
    AuthGatewayModule,
    UsersGatewayModule,
    NotificationsGatewayModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
