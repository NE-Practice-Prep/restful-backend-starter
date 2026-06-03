import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { toPublicCompliance } from "@shared/common/mappers/fire-extinguisher.mapper";
import { deriveComplianceStatus } from "@shared/common/utils/compliance.util";
import { coerceOptionalDate } from "@shared/common/utils/date.util";
import type { CheckComplianceDto } from "./dto/check-compliance.dto";

@Injectable()
export class ComplianceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check(checkedById: string, dto: CheckComplianceDto) {
    const extinguisher = await this.prisma.fireExtinguisher.findUnique({
      where: { id: dto.extinguisherId },
    });
    if (!extinguisher) throw new NotFoundException("Fire extinguisher not found");

    const autoStatus = deriveComplianceStatus(extinguisher.expiresAt);
    const status = dto.status ?? autoStatus;

    const [record] = await this.prisma.$transaction([
      this.prisma.complianceRecord.create({
        data: {
          extinguisherId: dto.extinguisherId,
          checkedById,
          status,
          regulationRef: dto.regulationRef?.trim() ?? "",
          notes: dto.notes?.trim() ?? "",
          dueAt: coerceOptionalDate(dto.dueAt, "dueAt") ?? extinguisher.expiresAt,
        },
        include: this.complianceInclude,
      }),
      this.prisma.fireExtinguisher.update({
        where: { id: dto.extinguisherId },
        data: { complianceStatus: status },
      }),
    ]);

    return toPublicCompliance(record);
  }

  async view(id: string) {
    const row = await this.prisma.complianceRecord.findUnique({
      where: { id },
      include: this.complianceInclude,
    });
    if (!row) throw new NotFoundException("Compliance record not found");
    return toPublicCompliance(row);
  }

  async remove(id: string) {
    await this.view(id);
    await this.prisma.complianceRecord.delete({ where: { id } });
    return { ok: true };
  }

  async list(extinguisherId?: string) {
    const rows = await this.prisma.complianceRecord.findMany({
      where: extinguisherId ? { extinguisherId } : undefined,
      include: this.complianceInclude,
      orderBy: { checkedAt: "desc" },
      take: 100,
    });
    return { data: rows.map(toPublicCompliance) };
  }

  async summary() {
    const [total, byStatus, expiringSoon, overdueInspections] = await Promise.all([
      this.prisma.fireExtinguisher.count(),
      this.prisma.fireExtinguisher.groupBy({
        by: ["complianceStatus"],
        _count: { _all: true },
      }),
      this.prisma.fireExtinguisher.count({
        where: { complianceStatus: "expiring_soon" },
      }),
      this.prisma.inspection.count({
        where: {
          status: { in: ["scheduled", "overdue"] },
          scheduledAt: { lt: new Date() },
        },
      }),
    ]);

    const statusBreakdown = Object.fromEntries(
      byStatus.map((row) => [row.complianceStatus, row._count._all]),
    );

    return {
      totalExtinguishers: total,
      statusBreakdown,
      expiringSoon,
      overdueInspections,
      generatedAt: new Date().toISOString(),
    };
  }

  private get complianceInclude() {
    return {
      extinguisher: {
        select: { id: true, serialNumber: true, location: true },
      },
      checkedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    } as const;
  }
}
