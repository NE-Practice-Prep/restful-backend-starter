import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { EmailModule } from "@shared/email/email.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [PrismaModule, EmailModule, AuthModule],
})
export class AppModule {}
