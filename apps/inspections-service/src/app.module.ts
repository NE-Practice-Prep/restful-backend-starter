import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { EmailModule } from "@shared/email/email.module";
import { InspectionsModule } from "./inspections/inspections.module";

@Module({
  imports: [PrismaModule, EmailModule, InspectionsModule],
})
export class AppModule {}
