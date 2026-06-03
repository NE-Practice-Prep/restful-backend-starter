import { Inject, Injectable, Logger } from "@nestjs/common";
import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { EXTINGUISHER_EXPIRY_WARNING_DAYS } from "@shared/constants/expiry.constants";
import { EmailService } from "@shared/email/email.service";
import { PrismaService } from "@shared/prisma/prisma.service";
import { sendEmailOnce } from "@shared/notifications/send-email-once.util";
import {
  ExtinguisherStatus,
  NotificationType,
  UserStatus,
} from "@shared/generated/prisma/enums";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const STARTUP_DELAY_MS = 15_000;

@Injectable()
export class ExpiryNotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExpiryNotificationsService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private startupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  onModuleInit() {
    this.startupTimer = setTimeout(() => {
      void this.runExpiryChecks().catch((e) =>
        this.logger.error("Initial expiry check failed", e),
      );
    }, STARTUP_DELAY_MS);

    this.timer = setInterval(() => {
      void this.runExpiryChecks().catch((e) =>
        this.logger.error("Scheduled expiry check failed", e),
      );
    }, CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.startupTimer) clearTimeout(this.startupTimer);
    if (this.timer) clearInterval(this.timer);
  }

  private startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private formatDate(date: Date) {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /** Sync expired status and send email alerts (once per user per unit per alert type). */
  async runExpiryChecks() {
    if (!this.email.isConfigured()) {
      this.logger.warn(
        "Skipping expiry email scan — configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env",
      );
      return {
        expiringSoon: 0,
        expired: 0,
        recipients: 0,
        emailsSent: 0,
        skipped: true,
      };
    }

    const today = this.startOfDay();
    const warningEnd = new Date(today);
    warningEnd.setDate(warningEnd.getDate() + EXTINGUISHER_EXPIRY_WARNING_DAYS);
    warningEnd.setHours(23, 59, 59, 999);

    await this.prisma.fireExtinguisher.updateMany({
      where: {
        expiryDate: { lt: today },
        status: { notIn: [ExtinguisherStatus.expired, ExtinguisherStatus.decommissioned] },
      },
      data: { status: ExtinguisherStatus.expired },
    });

    const [expiringSoon, expiredUnits, recipients] = await Promise.all([
      this.prisma.fireExtinguisher.findMany({
        where: {
          expiryDate: { gte: today, lte: warningEnd },
          status: { not: ExtinguisherStatus.decommissioned },
        },
      }),
      this.prisma.fireExtinguisher.findMany({
        where: {
          OR: [
            { expiryDate: { lt: today } },
            { status: ExtinguisherStatus.expired },
          ],
          status: { not: ExtinguisherStatus.decommissioned },
        },
      }),
      this.prisma.user.findMany({
        where: { status: UserStatus.active },
        select: { id: true, email: true, name: true, firstName: true, lastName: true },
      }),
    ]);

    let emailed = 0;

    for (const user of recipients) {
      const displayName =
        user.name?.trim() ||
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        "there";

      for (const unit of expiringSoon) {
        const daysLeft = Math.ceil(
          (unit.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        const title = "Extinguisher expiring soon";
        const message = `${unit.serialNumber} at ${unit.location} expires on ${this.formatDate(unit.expiryDate)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left).`;

        const { delivered } = await sendEmailOnce(this.prisma, {
          userId: user.id,
          eventKey: `extinguisher:${unit.id}:expiring_soon`,
          extinguisherId: unit.id,
          type: NotificationType.extinguisher_expiring_soon,
          title,
          message,
          send: () =>
            this.email.sendExtinguisherExpiringSoon(user.email, {
              name: displayName,
              serialNumber: unit.serialNumber,
              location: unit.location,
              expiryDate: this.formatDate(unit.expiryDate),
              daysLeft,
            }),
        });
        if (delivered) emailed += 1;
      }

      for (const unit of expiredUnits) {
        const title = "Extinguisher expired";
        const message = `${unit.serialNumber} at ${unit.location} expired on ${this.formatDate(unit.expiryDate)}. Schedule replacement or maintenance.`;

        const { delivered } = await sendEmailOnce(this.prisma, {
          userId: user.id,
          eventKey: `extinguisher:${unit.id}:expired`,
          extinguisherId: unit.id,
          type: NotificationType.extinguisher_expired,
          title,
          message,
          send: () =>
            this.email.sendExtinguisherExpired(user.email, {
              name: displayName,
              serialNumber: unit.serialNumber,
              location: unit.location,
              expiryDate: this.formatDate(unit.expiryDate),
            }),
        });
        if (delivered) emailed += 1;
      }
    }

    this.logger.log(
      `Expiry email scan: ${expiringSoon.length} expiring soon, ${expiredUnits.length} expired, ${recipients.length} recipients, ${emailed} emails delivered`,
    );

    return {
      expiringSoon: expiringSoon.length,
      expired: expiredUnits.length,
      recipients: recipients.length,
      emailsSent: emailed,
    };
  }
}
