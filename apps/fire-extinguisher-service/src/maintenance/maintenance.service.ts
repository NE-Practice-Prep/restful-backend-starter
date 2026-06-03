import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { EmailService } from "@shared/email/email.service";
import { toPublicMaintenance } from "@shared/common/mappers/fire-extinguisher.mapper";
import { coerceOptionalDate } from "@shared/common/utils/date.util";
import {
  extinguisherLabel,
  notifyExtinguisherAssignee,
} from "@shared/fire/notifications.helper";
import { ExtinguisherStatus } from "@shared/generated/prisma/enums";
import type { LogMaintenanceDto } from "./dto/log-maintenance.dto";
import type { UpdateMaintenanceDto } from "./dto/update-maintenance.dto";
import type { parseListMaintenanceQuery } from "./dto/list-maintenance-query.dto";

type ListParams = ReturnType<typeof parseListMaintenanceQuery>;

@Injectable()
export class MaintenanceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

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

    const performedAt = coerceOptionalDate(dto.performedAt, "performedAt") ?? new Date();
    const nextDueAt = coerceOptionalDate(dto.nextDueAt, "nextDueAt") ?? null;
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
          nextDueAt,
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
          nextMaintenanceDue: nextDueAt,
        },
      }),
    ]);

    const label = extinguisherLabel(extinguisher.serialNumber, extinguisher.location);
    await notifyExtinguisherAssignee(
      this.prisma,
      dto.extinguisherId,
      {
        type: "maintenance_logged",
        title: "Maintenance performed on your extinguisher",
        message: `Maintenance (${dto.type}) was performed on your assigned extinguisher (${label}). Description: ${dto.description.trim()}. Status after maintenance: ${statusAfter}.`,
      },
      this.email,
      { excludeUserIds: [performedById] },
    );

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

  async update(id: string, dto: UpdateMaintenanceDto) {
    await this.view(id);
    const row = await this.prisma.maintenanceRecord.update({
      where: { id },
      data: {
        type: dto.type,
        description: dto.description?.trim(),
        conditionsNoted: dto.conditionsNoted?.trim(),
        performedAt: coerceOptionalDate(dto.performedAt, "performedAt") ?? undefined,
        nextDueAt: coerceOptionalDate(dto.nextDueAt, "nextDueAt") ?? undefined,
        partsReplaced: dto.partsReplaced?.trim(),
        cost: dto.cost ?? undefined,
        statusAfter: dto.statusAfter,
      },
      include: this.maintenanceInclude,
    });
    return toPublicMaintenance(row);
  }

  async remove(id: string) {
    await this.view(id);
    await this.prisma.maintenanceRecord.delete({ where: { id } });
    return { ok: true };
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
