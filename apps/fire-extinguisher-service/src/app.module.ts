import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { FireModule } from "./fire.module";

@Module({
  imports: [PrismaModule, FireModule],
})
export class AppModule {}
