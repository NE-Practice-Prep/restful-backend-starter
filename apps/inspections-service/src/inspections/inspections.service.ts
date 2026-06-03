import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { EmailService } from "@shared/email/email.service";
import { InspectionStatus } from "@shared/common/enums/inspection-status.enum";
import { Role } from "@shared/common/enums/role.enum";
import { isInspectorRole } from "@shared/auth/role-policy";
import {
  ExtinguisherStatus,
  InspectionResult,
  NotificationType,
  UserStatus,
} from "@shared/generated/prisma/enums";
import { sendEmailOnce } from "@shared/notifications/send-email-once.util";
import type { RpcUserContext } from "@shared/types/rpc-context.type";
import type { ScheduleInspectionDto } from "./dto/schedule-inspection.dto";
import type { CompleteInspectionDto } from "./dto/complete-inspection.dto";
import type { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
import type {
  parseListInspectionsQuery,
  parseListMaintenanceQuery,
} from "./dto/list-inspections-query.dto";

type ListInspectionsParams = ReturnType<typeof parseListInspectionsQuery>;
type ListMaintenanceParams = ReturnType<typeof parseListMaintenanceQuery>;

@Injectable()
export class InspectionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  /** Only inspectors and admins may complete, cancel, or log maintenance */
  private assertInspector(actor: RpcUserContext) {
    if (!isInspectorRole(actor.role)) {
      throw new ForbiddenException("You do not have permission to perform this action");
    }
  }

  /** Midnight today — used to detect overdue scheduled inspections */
  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /** Promote past-due scheduled rows to overdue before reads */
  private async markOverdueInspections() {
    await this.prisma.inspection.updateMany({
      where: {
        status: InspectionStatus.scheduled,
        scheduledDate: { lt: this.startOfToday() },
      },
      data: { status: InspectionStatus.overdue },
    });
  }

  /** Promote a single inspection if its scheduled date has passed */
  private async markOverdueIfNeeded(id: string) {
    const inspection = await this.prisma.inspection.findUnique({ where: { id } });
    if (
      inspection &&
      inspection.status === InspectionStatus.scheduled &&
      inspection.scheduledDate < this.startOfToday()
    ) {
      await this.prisma.inspection.update({
        where: { id },
        data: { status: InspectionStatus.overdue },
      });
    }
  }

  async schedule(dto: ScheduleInspectionDto, actor: RpcUserContext) {
    const extinguisher = await this.prisma.fireExtinguisher.findUnique({
      where: { id: dto.extinguisherId },
    });
    if (!extinguisher) throw new NotFoundException("Fire extinguisher not found");

    const scheduledDate = new Date(dto.scheduledDate);
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new BadRequestException("Invalid scheduled date");
    }

    const inspection = await this.prisma.inspection.create({
      data: {
        extinguisherId: dto.extinguisherId,
        scheduledByUserId: actor.userId,
        scheduledDate,
        scheduledTime: dto.scheduledTime,
        notes: dto.notes,
      },
      include: {
        extinguisher: true,
        scheduledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    const scheduleMsg = `Inspection scheduled for ${extinguisher.serialNumber} at ${extinguisher.location} on ${dto.scheduledDate} at ${dto.scheduledTime}.`;

    const notifyUsers = await this.prisma.user.findMany({
      where: {
        status: UserStatus.active,
        OR: [
          { role: Role.admin },
          { role: Role.editor },
          { id: actor.userId },
        ],
      },
      select: { id: true, email: true, name: true, firstName: true, lastName: true },
    });

    for (const u of notifyUsers) {
      const displayName =
        u.name?.trim() || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "there";
      await sendEmailOnce(this.prisma, {
        userId: u.id,
        eventKey: `inspection:${inspection.id}:scheduled`,
        extinguisherId: extinguisher.id,
        type: NotificationType.inspection_scheduled,
        title: "Inspection scheduled",
        message: scheduleMsg,
        send: () =>
          this.email.sendInspectionScheduled(u.email, {
            name: displayName,
            extinguisherSerial: extinguisher.serialNumber,
            location: extinguisher.location,
            scheduledDate: dto.scheduledDate,
            scheduledTime: dto.scheduledTime,
          }),
      });
    }

    return inspection;
  }

  async findAll(query: ListInspectionsParams) {
    await this.markOverdueInspections();

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.extinguisherId ? { extinguisherId: query.extinguisherId } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.inspection.count({ where }),
      this.prisma.inspection.findMany({
        where,
        orderBy: { scheduledDate: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          extinguisher: { select: { id: true, serialNumber: true, location: true } },
          scheduledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findOne(id: string) {
    await this.markOverdueIfNeeded(id);

    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        extinguisher: true,
        scheduledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!inspection) throw new NotFoundException("Inspection not found");
    return inspection;
  }

  async complete(id: string, dto: CompleteInspectionDto, actor: RpcUserContext) {
    this.assertInspector(actor);
    await this.markOverdueIfNeeded(id);

    const inspection = await this.prisma.inspection.findUnique({ where: { id } });
    if (!inspection) throw new NotFoundException("Inspection not found");

    if (
      inspection.status !== InspectionStatus.scheduled &&
      inspection.status !== InspectionStatus.overdue
    ) {
      throw new BadRequestException("Only scheduled or overdue inspections can be completed");
    }

    const resultEnum =
      dto.result === "pass" ? InspectionResult.pass : InspectionResult.fail;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.inspection.update({
        where: { id },
        data: {
          status: InspectionStatus.completed,
          completedAt: new Date(),
          result: resultEnum,
          issuesFound: dto.issuesFound ?? "",
          recommendations: dto.recommendations ?? "",
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        },
        include: {
          extinguisher: true,
          scheduledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (resultEnum === InspectionResult.fail) {
        await tx.fireExtinguisher.update({
          where: { id: row.extinguisherId },
          data: { status: ExtinguisherStatus.maintenance_required },
        });
      }

      if (dto.maintenance) {
        await tx.maintenanceLog.create({
          data: {
            extinguisherId: row.extinguisherId,
            inspectorUserId: actor.userId,
            actionTaken: dto.maintenance.actionTaken,
            maintenanceDate: new Date(),
            issuesIdentified: dto.maintenance.issuesIdentified ?? dto.issuesFound ?? "",
            notes: dto.maintenance.notes ?? dto.notes ?? "",
          },
        });
      }

      return row;
    });

    const resultLabel = resultEnum === InspectionResult.pass ? "Passed" : "Failed";
    const completeMsg = `Inspection ${resultLabel} for ${updated.extinguisher.serialNumber} at ${updated.extinguisher.location}.${dto.issuesFound ? ` Issues: ${dto.issuesFound}` : ""}`;

    const notifyUsers = await this.prisma.user.findMany({
      where: {
        status: UserStatus.active,
        OR: [
          { role: Role.admin },
          { id: updated.scheduledByUserId },
        ],
      },
      select: { id: true, email: true, name: true, firstName: true, lastName: true },
    });

    const inspector = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { name: true, firstName: true, lastName: true },
    });
    const inspectorName =
      inspector?.name?.trim() ||
      `${inspector?.firstName ?? ""} ${inspector?.lastName ?? ""}`.trim() ||
      "Inspector";

    for (const u of notifyUsers) {
      const displayName =
        u.name?.trim() || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "there";
      await sendEmailOnce(this.prisma, {
        userId: u.id,
        eventKey: `inspection:${id}:completed:${resultEnum}`,
        extinguisherId: updated.extinguisherId,
        type: NotificationType.inspection_completed,
        title: `Inspection ${resultLabel.toLowerCase()}`,
        message: completeMsg,
        send: () =>
          this.email.sendInspectionCompleted(u.email, {
            name: displayName,
            inspectorName,
            result: resultLabel,
            extinguisherSerial: updated.extinguisher.serialNumber,
            location: updated.extinguisher.location,
            issuesFound: dto.issuesFound,
            recommendations: dto.recommendations,
          }),
      });
    }

    return updated;
  }

  async cancel(id: string, actor: RpcUserContext) {
    this.assertInspector(actor);
    await this.markOverdueIfNeeded(id);

    const inspection = await this.prisma.inspection.findUnique({ where: { id } });
    if (!inspection) throw new NotFoundException("Inspection not found");

    if (
      inspection.status !== InspectionStatus.scheduled &&
      inspection.status !== InspectionStatus.overdue
    ) {
      throw new BadRequestException("Only scheduled or overdue inspections can be cancelled");
    }

    return this.prisma.inspection.update({
      where: { id },
      data: { status: InspectionStatus.cancelled },
      include: {
        extinguisher: true,
        scheduledBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async createMaintenance(dto: CreateMaintenanceDto, actor: RpcUserContext) {
    this.assertInspector(actor);

    const extinguisher = await this.prisma.fireExtinguisher.findUnique({
      where: { id: dto.extinguisherId },
    });
    if (!extinguisher) throw new NotFoundException("Fire extinguisher not found");

    const maintenanceDate = new Date(dto.maintenanceDate);
    if (Number.isNaN(maintenanceDate.getTime())) {
      throw new BadRequestException("Invalid maintenance date");
    }

    return this.prisma.maintenanceLog.create({
      data: {
        extinguisherId: dto.extinguisherId,
        inspectorUserId: actor.userId,
        actionTaken: dto.actionTaken,
        maintenanceDate,
        issuesIdentified: dto.issuesIdentified ?? "",
        notes: dto.notes ?? "",
      },
      include: {
        extinguisher: { select: { id: true, serialNumber: true, location: true } },
        inspector: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findMaintenance(query: ListMaintenanceParams) {
    const where = {
      ...(query.extinguisherId ? { extinguisherId: query.extinguisherId } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.maintenanceLog.count({ where }),
      this.prisma.maintenanceLog.findMany({
        where,
        orderBy: { maintenanceDate: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          extinguisher: { select: { id: true, serialNumber: true, location: true } },
          inspector: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }
}
