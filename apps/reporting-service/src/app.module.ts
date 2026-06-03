import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { ReportingModule } from "./reporting.module";

@Module({
  imports: [PrismaModule, ReportingModule],
})
export class AppModule {}
