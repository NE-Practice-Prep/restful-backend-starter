import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { ExtinguishersModule } from "./extinguishers/extinguishers.module";

@Module({
  imports: [PrismaModule, ExtinguishersModule],
})
export class AppModule {}
