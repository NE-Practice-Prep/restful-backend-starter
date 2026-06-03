import { Global, Module } from "@nestjs/common";

import { EmailService } from "./email.service";
import { EmailStartupService } from "./email-startup.service";

@Global()
@Module({
  providers: [EmailService, EmailStartupService],
  exports: [EmailService],
})
export class EmailModule {}
