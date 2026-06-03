import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";

import { EmailService } from "./email.service";

@Injectable()
export class EmailStartupService implements OnModuleInit {
  private readonly logger = new Logger(EmailStartupService.name);

  constructor(@Inject(EmailService) private readonly email: EmailService) {}

  async onModuleInit() {
    if (!this.email.isConfigured()) {
      this.logger.warn(
        "SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email notifications will be logged only until .env is set.",
      );
      return;
    }

    const verified = await this.email.verifyConnection();
    if (verified) {
      this.logger.log("SMTP connection verified — email notifications are enabled.");
    } else {
      this.logger.warn(
        "SMTP credentials are set but connection verification failed. Check SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.",
      );
    }
  }
}
