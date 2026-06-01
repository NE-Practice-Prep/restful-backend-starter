import { Module } from "@nestjs/common";

import { PrismaModule } from "@shared/prisma/prisma.module";
import { EmailModule } from "@shared/email/email.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [PrismaModule, EmailModule, UsersModule],
})
export class AppModule {}
