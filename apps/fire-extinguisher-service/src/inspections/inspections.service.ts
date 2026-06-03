import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { Role } from "@shared/common/enums/role.enum";
import { toPublicInspection } from "@shared/common/mappers/fire-extinguisher.mapper";
import { coerceOptionalDate, coerceToDate } from "@shared/common/utils/date.util";
import { notifyPersonnel } from "@shared/fire/notifications.helper";
import {
  ExtinguisherStatus,
  InspectionResult,
  InspectionStatus,
} from "@shared/generated/prisma/enums";
import type { ScheduleInspectionDto } from "./dto/schedule-inspection.dto";
import type {
  CompleteInspectionDto,
  UpdateInspectionDto,
} from "./dto/complete-inspection.dto";
import type { parseListInspectionsQuery } from "./dto/list-inspections-query.dto";

type ListParams = ReturnType<typeof parseListInspectionsQuery>;

@Injectable()
export class InspectionsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async schedule(
    dto: ScheduleInspectionDto,
    requestedById: string,
  ) {
    const extinguisher = await this.prisma.fireExtinguisher.findUnique({
      where: { id: dto.extinguisherId },
    });
    if (!extinguisher) throw new NotFoundException("Fire extinguisher not found");

    if (dto.inspectorId) {
      await this.assertInspector(dto.inspectorId);
    }

    const scheduledAt = coerceToDate(dto.scheduledAt, "scheduledAt");

    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException("Scheduled time must be in the future");
    }

    const row = await this.prisma.inspection.create({
      data: {
        extinguisherId: dto.extinguisherId,
        inspectorId: dto.inspectorId ?? null,
        requestedById,
        scheduledAt,
        status: InspectionStatus.scheduled,
      },
      include: this.inspectionInclude,
    });

    await this.prisma.fireExtinguisher.update({
      where: { id: dto.extinguisherId },
      data: {
        status: ExtinguisherStatus.needs_inspection,
        nextInspectionDue: scheduledAt,
      },
    });

    const notifyIds = dto.inspectorId ? [dto.inspectorId, requestedById] : [requestedById];

    await notifyPersonnel(this.prisma, {
      type: "inspection_scheduled",
      title: "Inspection scheduled",
      message: `Inspection for extinguisher ${extinguisher.serialNumber} at ${extinguisher.location} is scheduled for ${scheduledAt.toISOString()}.`,
      roles: [Role.admin, Role.inspector],
      userIds: notifyIds,
    });

    return toPublicInspection(row);
  }

  async list(params: ListParams) {
    const where = {
      ...(params.extinguisherId ? { extinguisherId: params.extinguisherId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.inspection.count({ where }),
      this.prisma.inspection.findMany({
        where,
        include: this.inspectionInclude,
        orderBy: { scheduledAt: "desc" },
        skip,
        take: params.limit,
      }),
    ]);

    return {
      data: rows.map(toPublicInspection),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async view(id: string) {
    const row = await this.prisma.inspection.findUnique({
      where: { id },
      include: this.inspectionInclude,
    });
    if (!row) throw new NotFoundException("Inspection not found");
    return toPublicInspection(row);
  }

  async complete(id: string, inspectorId: string, dto: CompleteInspectionDto) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: { extinguisher: true },
    });
    if (!inspection) throw new NotFoundException("Inspection not found");

    const now = new Date();
    const statusAfter =
      dto.result === InspectionResult.fail
        ? ExtinguisherStatus.needs_maintenance
        : ExtinguisherStatus.in_service;

    const [row] = await this.prisma.$transaction([
      this.prisma.inspection.update({
        where: { id },
        data: {
          inspectorId,
          status: InspectionStatus.completed,
          result: dto.result,
          startedAt: inspection.startedAt ?? now,
          completedAt: now,
          pressureOk: dto.pressureOk,
          sealIntact: dto.sealIntact,
          gaugeReadable: dto.gaugeReadable,
          accessible: dto.accessible,
          findings: dto.findings?.trim() ?? "",
          correctiveAction: dto.correctiveAction?.trim() ?? "",
        },
        include: this.inspectionInclude,
      }),
      this.prisma.fireExtinguisher.update({
        where: { id: inspection.extinguisherId },
        data: {
          status: statusAfter,
          lastInspectionAt: now,
          nextInspectionDue: null,
        },
      }),
    ]);

    return toPublicInspection(row);
  }

  async remove(id: string) {
    await this.view(id);
    await this.prisma.inspection.delete({ where: { id } });
    return { ok: true };
  }

  async update(id: string, dto: UpdateInspectionDto) {
    await this.view(id);
    if (dto.inspectorId) await this.assertInspector(dto.inspectorId);

    const row = await this.prisma.inspection.update({
      where: { id },
      data: {
        status: dto.status,
        scheduledAt: coerceOptionalDate(dto.scheduledAt, "scheduledAt"),
        inspectorId: dto.inspectorId,
      },
      include: this.inspectionInclude,
    });

    return toPublicInspection(row);
  }

  private async assertInspector(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== Role.inspector && user.role !== Role.admin)) {
      throw new BadRequestException("Inspector must have inspector or admin role");
    }
  }

  private get inspectionInclude() {
    return {
      extinguisher: {
        select: { id: true, serialNumber: true, location: true },
      },
      inspector: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      requestedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    } as const;
  }
}
