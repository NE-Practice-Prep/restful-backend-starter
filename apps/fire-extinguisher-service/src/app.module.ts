import { Module } from "@nestjs/common";

import { EmailModule } from "@shared/email/email.module";
import { PrismaModule } from "@shared/prisma/prisma.module";
import { FireModule } from "./fire.module";

@Module({
  imports: [PrismaModule, EmailModule, FireModule],
})
export class AppModule {}
