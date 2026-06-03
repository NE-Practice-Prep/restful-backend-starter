import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@shared/generated/prisma/client";

import { PrismaService } from "@shared/prisma/prisma.service";
import { toPublicExtinguisher, toPublicReport } from "@shared/common/mappers/fire-extinguisher.mapper";
import { ReportStatus, ReportType } from "@shared/generated/prisma/enums";
import type { GenerateReportDto } from "./dto/generate-report.dto";

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async generate(generatedById: string, dto: GenerateReportDto) {
    const title = dto.title?.trim() || this.defaultTitle(dto.type);
    const parameters = (dto.parameters ?? {}) as Prisma.InputJsonValue;

    const report = await this.prisma.report.create({
      data: {
        type: dto.type,
        title,
        parameters,
        status: ReportStatus.generating,
        generatedById,
      },
    });

    try {
      const payload = await this.buildPayload(dto.type, dto.parameters ?? {});
      const completed = await this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.ready,
          rowCount: Array.isArray(payload.rows) ? payload.rows.length : 0,
          parameters: JSON.parse(
            JSON.stringify({ ...(dto.parameters ?? {}), snapshot: payload }),
          ) as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
      return { ...toPublicReport(completed), data: payload };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Report generation failed";
      const failed = await this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.failed,
          errorMessage: message,
          completedAt: new Date(),
        },
      });
      return toPublicReport(failed);
    }
  }

  async list(generatedById: string) {
    const rows = await this.prisma.report.findMany({
      where: { generatedById },
      orderBy: { requestedAt: "desc" },
      take: 50,
    });
    return { data: rows.map(toPublicReport) };
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const row = await this.prisma.report.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Report not found");
    if (!isAdmin && row.generatedById !== userId) {
      throw new NotFoundException("Report not found");
    }
    await this.prisma.report.delete({ where: { id } });
    return { ok: true };
  }

  async view(id: string, userId: string, isAdmin: boolean) {
    const row = await this.prisma.report.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Report not found");
    if (!isAdmin && row.generatedById !== userId) {
      throw new NotFoundException("Report not found");
    }

    const snapshot =
      typeof row.parameters === "object" &&
      row.parameters !== null &&
      "snapshot" in row.parameters
        ? (row.parameters as { snapshot?: unknown }).snapshot
        : undefined;

    return { ...toPublicReport(row), data: snapshot };
  }

  private defaultTitle(type: ReportType) {
    const labels: Record<ReportType, string> = {
      [ReportType.extinguisher_inventory]: "Extinguisher inventory",
      [ReportType.inspection_summary]: "Inspection summary",
      [ReportType.maintenance_log]: "Maintenance log",
      [ReportType.compliance_overview]: "Compliance overview",
      [ReportType.custom]: "Custom report",
    };
    return labels[type];
  }

  private async buildPayload(type: ReportType, parameters: Record<string, unknown>) {
    const generatedAt = new Date().toISOString();

    switch (type) {
      case ReportType.extinguisher_inventory: {
        const rows = await this.prisma.fireExtinguisher.findMany({
          include: { site: true },
          orderBy: { serialNumber: "asc" },
        });
        return {
          generatedAt,
          rows: rows.map(toPublicExtinguisher),
        };
      }
      case ReportType.inspection_summary: {
        const since =
          typeof parameters.since === "string" ? new Date(parameters.since) : undefined;
        const rows = await this.prisma.inspection.findMany({
          where: since ? { scheduledAt: { gte: since } } : undefined,
          include: {
            extinguisher: { select: { serialNumber: true, location: true } },
            inspector: { select: { email: true, firstName: true, lastName: true } },
          },
          orderBy: { scheduledAt: "desc" },
          take: 500,
        });
        return { generatedAt, rows };
      }
      case ReportType.maintenance_log: {
        const rows = await this.prisma.maintenanceRecord.findMany({
          include: {
            extinguisher: { select: { serialNumber: true, location: true } },
            performedBy: { select: { email: true, firstName: true, lastName: true } },
          },
          orderBy: { performedAt: "desc" },
          take: 500,
        });
        return { generatedAt, rows };
      }
      case ReportType.compliance_overview: {
        const extinguishers = await this.prisma.fireExtinguisher.findMany({
          select: {
            id: true,
            serialNumber: true,
            location: true,
            complianceStatus: true,
            expiresAt: true,
            status: true,
          },
        });
        const breakdown = extinguishers.reduce<Record<string, number>>((acc, row) => {
          acc[row.complianceStatus] = (acc[row.complianceStatus] ?? 0) + 1;
          return acc;
        }, {});
        return { generatedAt, breakdown, rows: extinguishers };
      }
      default:
        return { generatedAt, rows: [], parameters };
    }
  }
}
