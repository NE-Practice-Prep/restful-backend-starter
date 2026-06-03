import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";

@Injectable()
export class ReportingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async stockSummary() {
    const now = new Date();
    const generatedAt = now.toISOString();

    const [
      total,
      byStatus,
      byType,
      bySite,
      byComplianceStatus,
      assignedCount,
      unassignedCount,
    ] = await Promise.all([
      this.prisma.fireExtinguisher.count(),
      this.prisma.fireExtinguisher.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.fireExtinguisher.groupBy({ by: ["type"], _count: { _all: true } }),
      this.prisma.fireExtinguisher.groupBy({ by: ["siteId"], _count: { _all: true } }),
      this.prisma.fireExtinguisher.groupBy({ by: ["complianceStatus"], _count: { _all: true } }),
      this.prisma.fireExtinguisher.count({ where: { assignedToId: { not: null } } }),
      this.prisma.fireExtinguisher.count({ where: { assignedToId: null } }),
    ]);

    return {
      generatedAt,
      totalExtinguishers: total,
      assignedCount,
      unassignedCount,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
      byType: Object.fromEntries(byType.map((r) => [r.type, r._count._all])),
      byComplianceStatus: Object.fromEntries(
        byComplianceStatus.map((r) => [r.complianceStatus, r._count._all]),
      ),
      siteCount: bySite.length,
    };
  }

  async stockTrend(period: "daily" | "monthly" | "yearly") {
    const generatedAt = new Date().toISOString();
    const now = new Date();

    let since: Date;
    let buckets: number;

    if (period === "daily") {
      since = new Date(now);
      since.setDate(since.getDate() - 30);
      buckets = 30;
    } else if (period === "monthly") {
      since = new Date(now);
      since.setFullYear(since.getFullYear() - 1);
      buckets = 12;
    } else {
      since = new Date(now);
      since.setFullYear(since.getFullYear() - 5);
      buckets = 5;
    }

    const rows = await this.prisma.fireExtinguisher.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const trend = this.groupByPeriod(rows, period, since, now, buckets);

    return { generatedAt, period, since: since.toISOString(), trend };
  }

  async inspectionStatus() {
    const generatedAt = new Date().toISOString();
    const now = new Date();

    const [total, byStatus, byResult, overdueCount, upcoming30days] = await Promise.all([
      this.prisma.inspection.count(),
      this.prisma.inspection.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.inspection.groupBy({ by: ["result"], _count: { _all: true } }),
      this.prisma.inspection.count({
        where: {
          status: { in: ["scheduled", "overdue"] },
          scheduledAt: { lt: now },
        },
      }),
      this.prisma.inspection.count({
        where: {
          status: "scheduled",
          scheduledAt: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const recentCompleted = await this.prisma.inspection.findMany({
      where: { status: "completed" },
      select: {
        id: true,
        completedAt: true,
        result: true,
        extinguisher: { select: { serialNumber: true, location: true } },
        inspector: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    return {
      generatedAt,
      total,
      overdueCount,
      upcoming30days,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
      byResult: Object.fromEntries(byResult.map((r) => [r.result, r._count._all])),
      recentCompleted,
    };
  }

  async expiredExtinguishers() {
    const generatedAt = new Date().toISOString();
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [expired, expiring30, expiring90] = await Promise.all([
      this.prisma.fireExtinguisher.findMany({
        where: { expiresAt: { lt: now } },
        include: { site: { select: { name: true } }, assignedTo: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { expiresAt: "asc" },
      }),
      this.prisma.fireExtinguisher.findMany({
        where: { expiresAt: { gte: now, lt: in30Days } },
        include: { site: { select: { name: true } }, assignedTo: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { expiresAt: "asc" },
      }),
      this.prisma.fireExtinguisher.findMany({
        where: { expiresAt: { gte: in30Days, lt: in90Days } },
        include: { site: { select: { name: true } }, assignedTo: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { expiresAt: "asc" },
      }),
    ]);

    return {
      generatedAt,
      expiredCount: expired.length,
      expiring30daysCount: expiring30.length,
      expiring90daysCount: expiring90.length,
      expired: expired.map((e) => this.toExtinguisherSummary(e)),
      expiringSoon30Days: expiring30.map((e) => this.toExtinguisherSummary(e)),
      expiringSoon90Days: expiring90.map((e) => this.toExtinguisherSummary(e)),
    };
  }

  async maintenanceHistory(params: { page: number; limit: number; extinguisherId?: string; since?: string }) {
    const generatedAt = new Date().toISOString();

    const where = {
      ...(params.extinguisherId ? { extinguisherId: params.extinguisherId } : {}),
      ...(params.since ? { performedAt: { gte: new Date(params.since) } } : {}),
    };

    const skip = (params.page - 1) * params.limit;

    const [total, records, summary] = await Promise.all([
      this.prisma.maintenanceRecord.count({ where }),
      this.prisma.maintenanceRecord.findMany({
        where,
        include: {
          extinguisher: { select: { serialNumber: true, location: true } },
          performedBy: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { performedAt: "desc" },
        skip,
        take: params.limit,
      }),
      this.prisma.maintenanceRecord.groupBy({ by: ["type"], _count: { _all: true }, where }),
    ]);

    return {
      generatedAt,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
      byType: Object.fromEntries(summary.map((r) => [r.type, r._count._all])),
      records: records.map((r) => ({
        id: r.id,
        extinguisher: r.extinguisher,
        type: r.type,
        description: r.description,
        conditionsNoted: r.conditionsNoted,
        performedAt: r.performedAt.toISOString(),
        nextDueAt: r.nextDueAt?.toISOString() ?? null,
        partsReplaced: r.partsReplaced,
        cost: r.cost ? Number(r.cost) : null,
        statusAfter: r.statusAfter,
        performedBy: r.performedBy,
      })),
    };
  }

  private groupByPeriod(
    rows: Array<{ createdAt: Date; status: string }>,
    period: "daily" | "monthly" | "yearly",
    since: Date,
    now: Date,
    buckets: number,
  ) {
    const result: Array<{ label: string; count: number }> = [];

    for (let i = 0; i < buckets; i++) {
      let start: Date;
      let end: Date;
      let label: string;

      if (period === "daily") {
        start = new Date(since);
        start.setDate(since.getDate() + i);
        end = new Date(start);
        end.setDate(start.getDate() + 1);
        label = start.toISOString().substring(0, 10);
      } else if (period === "monthly") {
        start = new Date(since);
        start.setMonth(since.getMonth() + i);
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      } else {
        start = new Date(since);
        start.setFullYear(since.getFullYear() + i);
        end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        label = String(start.getFullYear());
      }

      const count = rows.filter(
        (r) => r.createdAt >= start && r.createdAt < end,
      ).length;

      result.push({ label, count });
    }

    return result;
  }

  private toExtinguisherSummary(e: {
    id: string;
    serialNumber: string;
    location: string;
    type: string;
    size: string;
    expiresAt: Date;
    status: string;
    complianceStatus: string;
    site: { name: string } | null;
    assignedTo: { firstName: string; lastName: string; email: string } | null;
  }) {
    return {
      id: e.id,
      serialNumber: e.serialNumber,
      location: e.location,
      type: e.type,
      size: e.size,
      expiresAt: e.expiresAt.toISOString(),
      status: e.status,
      complianceStatus: e.complianceStatus,
      site: e.site?.name ?? null,
      assignedTo: e.assignedTo,
    };
  }
}
