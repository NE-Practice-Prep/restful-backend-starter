import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { Role } from "@shared/common/enums/role.enum";
import { deriveComplianceStatus } from "@shared/common/utils/compliance.util";
import { EmailService } from "@shared/email/email.service";
import {
  activeExtinguisherWhere,
  formatExpiryDate,
  getExpiryWindowDates,
} from "@shared/fire/expiry-windows.util";
import {
  extinguisherLabel,
  notifyPersonnel,
} from "@shared/fire/notifications.helper";
import { PrismaService } from "@shared/prisma/prisma.service";
import type { ComplianceStatus } from "@shared/generated/prisma/enums";

type ExtinguisherExpiryRow = {
  id: string;
  serialNumber: string;
  location: string;
  expiresAt: Date;
  assignedToId: string | null;
  complianceStatus: ComplianceStatus;
};

@Injectable()
export class ExpiryCheckScheduler {
  private readonly logger = new Logger(ExpiryCheckScheduler.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    name: "extinguisherExpiryCheck",
    timeZone: (process.env.CRON_TIMEZONE ?? "UTC").trim(),
  })
  async handleDailyExpiryCheck() {
    await this.runExpiryCheck();
  }

  /** Runs expiry scan and notifications (also used by tests). */
  async runExpiryCheck() {
    const { now, in30Days, in90Days } = getExpiryWindowDates();
    const baseWhere = activeExtinguisherWhere;

    const select = {
      id: true,
      serialNumber: true,
      location: true,
      expiresAt: true,
      assignedToId: true,
      complianceStatus: true,
    } as const;

    const [expired, expiring30, expiring90, allActive] = await Promise.all([
      this.prisma.fireExtinguisher.findMany({
        where: { ...baseWhere, expiresAt: { lt: now } },
        select,
        orderBy: { expiresAt: "asc" },
      }),
      this.prisma.fireExtinguisher.findMany({
        where: { ...baseWhere, expiresAt: { gte: now, lt: in30Days } },
        select,
        orderBy: { expiresAt: "asc" },
      }),
      this.prisma.fireExtinguisher.findMany({
        where: { ...baseWhere, expiresAt: { gte: in30Days, lt: in90Days } },
        select,
        orderBy: { expiresAt: "asc" },
      }),
      this.prisma.fireExtinguisher.findMany({
        where: baseWhere,
        select: { id: true, expiresAt: true, complianceStatus: true },
      }),
    ]);

    await this.syncComplianceStatuses(allActive, now);

    const hasAlerts =
      expired.length > 0 || expiring30.length > 0 || expiring90.length > 0;
    if (!hasAlerts) {
      this.logger.log("Daily expiry check: no expired or expiring extinguishers");
      return;
    }

    this.logger.log(
      `Daily expiry check: expired=${expired.length}, within30d=${expiring30.length}, within90d=${expiring90.length}`,
    );

    await this.notifyOperationsTeam(expired, expiring30, expiring90);
    await this.notifyAssignees(expired, expiring30);
  }

  private async syncComplianceStatuses(
    rows: { id: string; expiresAt: Date; complianceStatus: ComplianceStatus }[],
    now: Date,
  ) {
    await Promise.all(
      rows.map(async (row) => {
        const next = deriveComplianceStatus(row.expiresAt, now);
        if (next === row.complianceStatus) return;
        await this.prisma.fireExtinguisher.update({
          where: { id: row.id },
          data: { complianceStatus: next },
        });
      }),
    );
  }

  private async notifyOperationsTeam(
    expired: ExtinguisherExpiryRow[],
    expiring30: ExtinguisherExpiryRow[],
    expiring90: ExtinguisherExpiryRow[],
  ) {
    const parts: string[] = [];
    if (expired.length > 0) {
      parts.push(
        `${expired.length} extinguisher(s) have expired and require immediate action.`,
      );
      parts.push(this.formatExtinguisherList(expired));
    }
    if (expiring30.length > 0) {
      parts.push(
        `${expiring30.length} extinguisher(s) expire within 30 days.`,
      );
      parts.push(this.formatExtinguisherList(expiring30));
    }
    if (expiring90.length > 0) {
      parts.push(
        `${expiring90.length} extinguisher(s) expire within 90 days (planning window).`,
      );
      parts.push(this.formatExtinguisherList(expiring90));
    }

    const urgent = expired.length > 0 || expiring30.length > 0;
    await notifyPersonnel(
      this.prisma,
      {
        type: urgent ? "extinguisher_expiry_alert" : "extinguisher_expiry_upcoming",
        title: urgent
          ? "Fire extinguisher expiry alert"
          : "Fire extinguisher expiry summary",
        message: parts.join("\n\n"),
        roles: [Role.admin, Role.inspector],
      },
      this.email,
    );
  }

  private async notifyAssignees(
    expired: ExtinguisherExpiryRow[],
    expiring30: ExtinguisherExpiryRow[],
  ) {
    const byUser = new Map<string, ExtinguisherExpiryRow[]>();

    for (const row of [...expired, ...expiring30]) {
      if (!row.assignedToId) continue;
      const list = byUser.get(row.assignedToId) ?? [];
      list.push(row);
      byUser.set(row.assignedToId, list);
    }

    const now = new Date();

    for (const [userId, rows] of byUser) {
      const lines = rows.map((row) => {
        const label = extinguisherLabel(row.serialNumber, row.location);
        const status =
          row.expiresAt.getTime() < now.getTime() ? "expired" : "expiring soon";
        return `• ${label} — ${status} (expires ${formatExpiryDate(row.expiresAt)})`;
      });

      const hasExpired = rows.some((row) => row.expiresAt.getTime() < now.getTime());

      await notifyPersonnel(
        this.prisma,
        {
          type: hasExpired
            ? "assigned_extinguisher_expired"
            : "assigned_extinguisher_expiring",
          title: hasExpired
            ? "Your assigned extinguisher(s) have expired"
            : "Your assigned extinguisher(s) are expiring soon",
          message: `Daily expiry check found the following assigned extinguisher(s):\n\n${lines.join("\n")}`,
          roles: [],
          userIds: [userId],
        },
        this.email,
      );
    }
  }

  private formatExtinguisherList(rows: ExtinguisherExpiryRow[]): string {
    return rows
      .map(
        (row) =>
          `• ${extinguisherLabel(row.serialNumber, row.location)} — expires ${formatExpiryDate(row.expiresAt)}`,
      )
      .join("\n");
  }
}
