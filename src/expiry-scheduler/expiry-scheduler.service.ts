import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  getExtinguisherLifecycleStatus,
  daysUntilExpiry,
} from "../common/utils/extinguisher-status.util";

@Injectable()
export class ExpirySchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ExpirySchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(EmailService) private readonly email: EmailService,
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    void this.runChecks();
    this.intervalHandle = setInterval(() => void this.runChecks(), 60_000);
    this.logger.log("Expiry scheduler started (runs every 60 seconds)");
  }

  async runChecks() {
    try {
      const warningDays = await this.settingsService.getExpiryWarningDays();
      const assigned = await this.prisma.fireExtinguisher.findMany({
        where: { status: "assigned", customerId: { not: null } },
        include: {
          customer: { include: { user: true } },
        },
      });

      for (const extinguisher of assigned) {
        if (!extinguisher.customer) continue;

        const lifecycle = getExtinguisherLifecycleStatus(
          extinguisher.expiryDate,
          warningDays,
        );
        const daysLeft = daysUntilExpiry(extinguisher.expiryDate);

        if (lifecycle === "expiring_soon") {
          await this.handleWarning(
            {
              id: extinguisher.id,
              serialNumber: extinguisher.serialNumber,
              type: extinguisher.type,
              expiryDate: extinguisher.expiryDate,
              customer: extinguisher.customer,
            },
            daysLeft,
          );
        } else if (lifecycle === "expired") {
          await this.handleExpired({
            id: extinguisher.id,
            serialNumber: extinguisher.serialNumber,
            type: extinguisher.type,
            expiryDate: extinguisher.expiryDate,
            customer: extinguisher.customer,
          });
        }
      }
    } catch (error) {
      this.logger.error("Expiry check failed", error);
    }
  }

  private async handleWarning(
    extinguisher: {
      id: string;
      serialNumber: string;
      type: string;
      expiryDate: Date;
      customer: {
        id: string;
        name: string;
        email: string;
        userId: string | null;
      };
    },
    daysLeft: number,
  ) {
    const emailType = "warning";

    const alreadySent = await this.prisma.expiryEmailLog.findUnique({
      where: {
        extinguisherId_emailType: {
          extinguisherId: extinguisher.id,
          emailType,
        },
      },
    });

    if (!alreadySent) {
      await this.email.sendExpiryWarning(
        extinguisher.customer.email,
        extinguisher.customer.name,
        extinguisher.serialNumber,
        extinguisher.type,
        extinguisher.expiryDate,
        daysLeft,
      );

      await this.prisma.expiryEmailLog.create({
        data: {
          customerId: extinguisher.customer.id,
          extinguisherId: extinguisher.id,
          emailType,
        },
      });
    }

    if (extinguisher.customer.userId) {
      await this.notificationsService.createNotification({
        userId: extinguisher.customer.userId,
        type: "expiring_soon",
        title: "Extinguisher expiring soon",
        message: `Unit ${extinguisher.serialNumber} expires in ${daysLeft} day(s). Please request a renewal if needed.`,
        extinguisherId: extinguisher.id,
      });
    }
  }

  private async handleExpired(
    extinguisher: {
      id: string;
      serialNumber: string;
      type: string;
      expiryDate: Date;
      customer: {
        id: string;
        name: string;
        email: string;
        userId: string | null;
      };
    },
  ) {
    const emailType = "expired";

    const alreadySent = await this.prisma.expiryEmailLog.findUnique({
      where: {
        extinguisherId_emailType: {
          extinguisherId: extinguisher.id,
          emailType,
        },
      },
    });

    if (!alreadySent) {
      await this.email.sendExpiryNotice(
        extinguisher.customer.email,
        extinguisher.customer.name,
        extinguisher.serialNumber,
        extinguisher.type,
        extinguisher.expiryDate,
      );

      await this.prisma.expiryEmailLog.create({
        data: {
          customerId: extinguisher.customer.id,
          extinguisherId: extinguisher.id,
          emailType,
        },
      });
    }

    if (extinguisher.customer.userId) {
      await this.notificationsService.createNotification({
        userId: extinguisher.customer.userId,
        type: "expired",
        title: "Extinguisher expired",
        message: `Unit ${extinguisher.serialNumber} has expired. Please submit a renewal request.`,
        extinguisherId: extinguisher.id,
      });
    }
  }
}
