import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { EmailModule } from "@shared/email/email.module";
import { PrismaModule } from "@shared/prisma/prisma.module";
import { FireModule } from "./fire.module";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, EmailModule, FireModule],
})
export class AppModule {}
