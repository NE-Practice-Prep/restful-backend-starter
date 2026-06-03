import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { toPublicMaintenance } from "@shared/common/mappers/fire-extinguisher.mapper";
import { ExtinguisherStatus } from "@shared/generated/prisma/enums";
import type { LogMaintenanceDto } from "./dto/log-maintenance.dto";
import type { parseListMaintenanceQuery } from "./dto/list-maintenance-query.dto";

type ListParams = ReturnType<typeof parseListMaintenanceQuery>;

@Injectable()
export class MaintenanceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(performedById: string, dto: LogMaintenanceDto) {
    const extinguisher = await this.prisma.fireExtinguisher.findUnique({
      where: { id: dto.extinguisherId },
    });
    if (!extinguisher) throw new NotFoundException("Fire extinguisher not found");

    if (dto.inspectionId) {
      const inspection = await this.prisma.inspection.findUnique({
        where: { id: dto.inspectionId },
      });
      if (!inspection) throw new NotFoundException("Inspection not found");
    }

    const performedAt = dto.performedAt ?? new Date();
    const statusAfter = dto.statusAfter ?? ExtinguisherStatus.in_service;

    const [row] = await this.prisma.$transaction([
      this.prisma.maintenanceRecord.create({
        data: {
          extinguisherId: dto.extinguisherId,
          inspectionId: dto.inspectionId ?? null,
          performedById,
          type: dto.type,
          description: dto.description.trim(),
          conditionsNoted: dto.conditionsNoted.trim(),
          performedAt,
          nextDueAt: dto.nextDueAt ?? null,
          partsReplaced: dto.partsReplaced?.trim() ?? "",
          cost: dto.cost ?? null,
          statusAfter,
        },
        include: this.maintenanceInclude,
      }),
      this.prisma.fireExtinguisher.update({
        where: { id: dto.extinguisherId },
        data: {
          status: statusAfter,
          lastMaintenanceAt: performedAt,
          nextMaintenanceDue: dto.nextDueAt ?? null,
        },
      }),
    ]);

    return toPublicMaintenance(row);
  }

  async list(params: ListParams) {
    const where = {
      ...(params.extinguisherId ? { extinguisherId: params.extinguisherId } : {}),
    };
    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.maintenanceRecord.count({ where }),
      this.prisma.maintenanceRecord.findMany({
        where,
        include: this.maintenanceInclude,
        orderBy: { performedAt: "desc" },
        skip,
        take: params.limit,
      }),
    ]);

    return {
      data: rows.map(toPublicMaintenance),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async view(id: string) {
    const row = await this.prisma.maintenanceRecord.findUnique({
      where: { id },
      include: this.maintenanceInclude,
    });
    if (!row) throw new NotFoundException("Maintenance record not found");
    return toPublicMaintenance(row);
  }

  private get maintenanceInclude() {
    return {
      extinguisher: {
        select: { id: true, serialNumber: true, location: true },
      },
      performedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    } as const;
  }
}
