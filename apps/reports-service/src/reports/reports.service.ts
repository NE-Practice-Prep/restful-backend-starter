import { ForbiddenException, Inject, Injectable } from "@nestjs/common";

import {
  ExtinguisherStatus,
  InspectionStatus,
  UserRole,
  UserStatus,
} from "@shared/generated/prisma/enums";
import { PrismaService } from "@shared/prisma/prisma.service";
import { Role } from "@shared/common/enums/role.enum";
import { isInspectorRole } from "@shared/auth/role-policy";
import type { RpcUserContext } from "@shared/types/rpc-context.type";

const UPCOMING_EXPIRY_DAYS = 30;

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private startOfMonth(date = new Date()) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private startOfYear(date = new Date()) {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private daysFromNow(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  async inventory(actor: RpcUserContext) {
    if (isInspectorRole(actor.role)) {
      return this.inventoryFull();
    }
    return this.inventorySummary();
  }

  private async inventoryFull() {
    const now = new Date();
    const dayStart = this.startOfDay(now);
    const monthStart = this.startOfMonth(now);
    const yearStart = this.startOfYear(now);

    const [total, byStatus, byType, dailyAdded, monthlyAdded, yearlyAdded] = await Promise.all([
      this.prisma.fireExtinguisher.count(),
      this.prisma.fireExtinguisher.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.fireExtinguisher.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      this.prisma.fireExtinguisher.count({ where: { createdAt: { gte: dayStart } } }),
      this.prisma.fireExtinguisher.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.fireExtinguisher.count({ where: { createdAt: { gte: yearStart } } }),
    ]);

    return {
      scope: "full" as const,
      total,
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      byType: Object.fromEntries(byType.map((row) => [row.type, row._count._all])),
      summaries: {
        daily: { periodStart: dayStart.toISOString(), added: dailyAdded },
        monthly: { periodStart: monthStart.toISOString(), added: monthlyAdded },
        yearly: { periodStart: yearStart.toISOString(), added: yearlyAdded },
      },
      generatedAt: now.toISOString(),
    };
  }

  private async inventorySummary() {
    const [total, byStatus] = await Promise.all([
      this.prisma.fireExtinguisher.count(),
      this.prisma.fireExtinguisher.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    return {
      scope: "summary" as const,
      total,
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      generatedAt: new Date().toISOString(),
    };
  }

  async inspections(actor: RpcUserContext) {
    if (isInspectorRole(actor.role)) {
      return this.inspectionsFull();
    }
    return this.inspectionsViewer(actor.userId);
  }

  private async inspectionsFull() {
    const [byStatus, total, upcoming] = await Promise.all([
      this.prisma.inspection.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.inspection.count(),
      this.prisma.inspection.findMany({
        where: { status: { in: ["scheduled", "overdue"] } },
        orderBy: { scheduledDate: "asc" },
        take: 10,
        select: {
          id: true,
          status: true,
          scheduledDate: true,
          scheduledTime: true,
          extinguisher: { select: { serialNumber: true, location: true } },
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));

    return {
      scope: "full" as const,
      total,
      pending: (statusCounts.scheduled ?? 0) + (statusCounts.overdue ?? 0),
      completed: statusCounts.completed ?? 0,
      overdue: statusCounts.overdue ?? 0,
      cancelled: statusCounts.cancelled ?? 0,
      byStatus: statusCounts,
      upcoming,
      generatedAt: new Date().toISOString(),
    };
  }

  private async inspectionsViewer(userId: string) {
    const pendingWhere = {
      status: { in: [InspectionStatus.scheduled, InspectionStatus.overdue] },
    };
    const ownScheduledWhere = {
      scheduledByUserId: userId,
      status: "scheduled" as const,
    };

    const [pendingCount, ownScheduledCount, ownScheduled] = await Promise.all([
      this.prisma.inspection.count({ where: pendingWhere }),
      this.prisma.inspection.count({ where: ownScheduledWhere }),
      this.prisma.inspection.findMany({
        where: ownScheduledWhere,
        orderBy: { scheduledDate: "asc" },
        take: 10,
        select: {
          id: true,
          status: true,
          scheduledDate: true,
          scheduledTime: true,
          extinguisher: { select: { serialNumber: true, location: true } },
        },
      }),
    ]);

    return {
      scope: "viewer" as const,
      pending: pendingCount,
      ownScheduled: {
        count: ownScheduledCount,
        items: ownScheduled,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async compliance(_actor: RpcUserContext) {
    const now = new Date();
    const upcomingCutoff = this.daysFromNow(UPCOMING_EXPIRY_DAYS);

    const [total, expired, upcomingExpirations, maintenanceRequired, activeCompliant] =
      await Promise.all([
        this.prisma.fireExtinguisher.count(),
        this.prisma.fireExtinguisher.count({
          where: {
            OR: [{ status: "expired" }, { expiryDate: { lt: now } }],
          },
        }),
        this.prisma.fireExtinguisher.count({
          where: {
            status: { not: "decommissioned" },
            expiryDate: { gte: now, lte: upcomingCutoff },
          },
        }),
        this.prisma.fireExtinguisher.count({
          where: { status: "maintenance_required" },
        }),
        this.prisma.fireExtinguisher.count({
          where: {
            status: "active",
            expiryDate: { gt: upcomingCutoff },
          },
        }),
      ]);

    const complianceRate =
      total > 0 ? Math.round(((activeCompliant / total) * 100 + Number.EPSILON) * 100) / 100 : 100;

    return {
      scope: "all" as const,
      total,
      expired,
      upcomingExpirations,
      maintenanceRequired,
      activeCompliant,
      complianceRate,
      upcomingExpiryWindowDays: UPCOMING_EXPIRY_DAYS,
      generatedAt: now.toISOString(),
    };
  }

  /** Role-specific dashboard KPIs aligned with TZW user journeys */
  async overview(actor: RpcUserContext) {
    const now = new Date();
    const upcomingCutoff = this.daysFromNow(UPCOMING_EXPIRY_DAYS);
    const todayStart = this.startOfDay(now);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const pendingWhere = {
      status: { in: [InspectionStatus.scheduled, InspectionStatus.overdue] },
    };

    if (actor.role === Role.admin) {
      const [
        totalExtinguishers,
        activeInspectors,
        pendingInspections,
        expiredExtinguishers,
        upcomingExpirations,
        completedInspections,
      ] = await Promise.all([
        this.prisma.fireExtinguisher.count(),
        this.prisma.user.count({
          where: { role: UserRole.editor, status: UserStatus.active },
        }),
        this.prisma.inspection.count({ where: pendingWhere }),
        this.prisma.fireExtinguisher.count({
          where: {
            OR: [{ status: ExtinguisherStatus.expired }, { expiryDate: { lt: now } }],
          },
        }),
        this.prisma.fireExtinguisher.count({
          where: {
            status: { not: ExtinguisherStatus.decommissioned },
            expiryDate: { gte: now, lte: upcomingCutoff },
          },
        }),
        this.prisma.inspection.count({ where: { status: InspectionStatus.completed } }),
      ]);

      return {
        role: "admin" as const,
        totalExtinguishers,
        activeInspectors,
        pendingInspections,
        expiredExtinguishers,
        upcomingExpirations,
        completedInspections,
        generatedAt: now.toISOString(),
      };
    }

    if (isInspectorRole(actor.role)) {
      const [todayInspections, upcomingInspections, overdueInspections, todayItems] =
        await Promise.all([
          this.prisma.inspection.count({
            where: {
              status: { in: [InspectionStatus.scheduled, InspectionStatus.overdue] },
              scheduledDate: { gte: todayStart, lte: todayEnd },
            },
          }),
          this.prisma.inspection.count({
            where: {
              status: InspectionStatus.scheduled,
              scheduledDate: { gt: todayEnd },
            },
          }),
          this.prisma.inspection.count({ where: { status: InspectionStatus.overdue } }),
          this.prisma.inspection.findMany({
            where: {
              status: { in: [InspectionStatus.scheduled, InspectionStatus.overdue] },
              scheduledDate: { gte: todayStart, lte: todayEnd },
            },
            orderBy: { scheduledTime: "asc" },
            take: 8,
            select: {
              id: true,
              status: true,
              scheduledDate: true,
              scheduledTime: true,
              extinguisher: { select: { serialNumber: true, location: true } },
            },
          }),
        ]);

      return {
        role: "inspector" as const,
        todayInspections,
        upcomingInspections,
        overdueInspections,
        todayItems,
        generatedAt: now.toISOString(),
      };
    }

    const [totalExtinguishers, activeExtinguishers, expiringSoon, ownScheduled] =
      await Promise.all([
        this.prisma.fireExtinguisher.count(),
        this.prisma.fireExtinguisher.count({ where: { status: ExtinguisherStatus.active } }),
        this.prisma.fireExtinguisher.count({
          where: {
            status: { not: ExtinguisherStatus.decommissioned },
            expiryDate: { gte: now, lte: upcomingCutoff },
          },
        }),
        this.prisma.inspection.count({
          where: { scheduledByUserId: actor.userId, status: InspectionStatus.scheduled },
        }),
      ]);

    return {
      role: "user" as const,
      totalExtinguishers,
      activeExtinguishers,
      expiringSoon,
      pendingInspections: await this.prisma.inspection.count({ where: pendingWhere }),
      ownScheduled,
      generatedAt: now.toISOString(),
    };
  }

  async maintenance(actor: RpcUserContext) {
    if (actor.role === Role.viewer) {
      throw new ForbiddenException("You do not have permission to view maintenance reports");
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, last30Days, recent] = await Promise.all([
      this.prisma.maintenanceLog.count(),
      this.prisma.maintenanceLog.count({
        where: { maintenanceDate: { gte: thirtyDaysAgo } },
      }),
      this.prisma.maintenanceLog.findMany({
        orderBy: { maintenanceDate: "desc" },
        take: 10,
        select: {
          id: true,
          actionTaken: true,
          maintenanceDate: true,
          issuesIdentified: true,
          extinguisher: { select: { serialNumber: true, location: true } },
          inspector: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    const yearLogs = await this.prisma.maintenanceLog.findMany({
      where: { maintenanceDate: { gte: this.startOfYear(now) } },
      select: { maintenanceDate: true },
    });

    const frequencyByMonth: Record<string, number> = {};
    for (const row of yearLogs) {
      const key = `${row.maintenanceDate.getUTCFullYear()}-${String(row.maintenanceDate.getUTCMonth() + 1).padStart(2, "0")}`;
      frequencyByMonth[key] = (frequencyByMonth[key] ?? 0) + 1;
    }

    return {
      scope: "full" as const,
      total,
      last30Days,
      frequencyByMonth,
      recent,
      generatedAt: now.toISOString(),
    };
  }
}
