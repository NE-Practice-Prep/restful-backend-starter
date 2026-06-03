/**
 * Root gateway module — wires Prisma (for JWT/strategy if needed), TCP clients, and HTTP feature modules.
 * Each *GatewayModule exposes REST routes that proxy to one microservice.
 */
import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { MicroservicesModule } from "./clients/microservices.module";
import { AppController } from "./app.controller";
import { AuthGatewayModule } from "./auth/auth.gateway.module";
import { UsersGatewayModule } from "./users/users.gateway.module";
import { ExtinguishersGatewayModule } from "./extinguishers/extinguishers.gateway.module";
import { InspectionsGatewayModule } from "./inspections/inspections.gateway.module";
import { ReportsGatewayModule } from "./reports/reports.gateway.module";
@Module({
  imports: [
    PrismaModule,
    MicroservicesModule,
    AuthGatewayModule,
    UsersGatewayModule,
    ExtinguishersGatewayModule,
    InspectionsGatewayModule,
    ReportsGatewayModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
