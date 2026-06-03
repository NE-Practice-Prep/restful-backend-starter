import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [PrismaModule, ReportsModule],
})
export class AppModule {}
