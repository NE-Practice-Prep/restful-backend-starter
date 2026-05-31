import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "../generated/prisma/client";
import { SettingsService } from "../settings/settings.service";
import { toExtinguisher } from "../common/mappers/extinguisher.mapper";
import {
  getExtinguisherLifecycleStatus,
  startOfDay,
} from "../common/utils/extinguisher-status.util";
import type {
  AssignExtinguisherDto,
  CreateExtinguisherDto,
  ReplaceExtinguisherDto,
  UpdateExtinguisherDto,
} from "./dto/extinguisher.dto";
import type { parseListExtinguishersQuery } from "./dto/list-extinguishers-query.dto";

type ListParams = ReturnType<typeof parseListExtinguishersQuery>;

@Injectable()
export class ExtinguishersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
  ) {}

  private readonly extinguisherInclude = {
    customer: { select: { id: true, name: true, email: true } },
  } as const;

  private readonly extinguisherSelect = {
    id: true,
    serialNumber: true,
    type: true,
    manufactureDate: true,
    expiryDate: true,
    status: true,
    customerId: true,
    createdAt: true,
    updatedAt: true,
    customer: { select: { id: true, name: true, email: true } },
  } as const;

  private parseDate(value: string, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date for ${field}`);
    }
    return date;
  }

  async findAll(params: ListParams, warningDays?: number) {
    const days = warningDays ?? (await this.settingsService.getExpiryWarningDays());

    const where: Record<string, unknown> = {};

    if (params.q) {
      where.OR = [
        { serialNumber: { contains: params.q, mode: "insensitive" } },
        { type: { contains: params.q, mode: "insensitive" } },
        { customer: { name: { contains: params.q, mode: "insensitive" } } },
      ];
    }

    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;

    const rows = await this.prisma.fireExtinguisher.findMany({
      where,
      orderBy: { expiryDate: "asc" },
      select: this.extinguisherSelect,
    });

    let mapped = rows.map((row) => toExtinguisher(row, days));

    if (params.lifecycle) {
      mapped = mapped.filter((row) => row.lifecycleStatus === params.lifecycle);
    }

    const total = mapped.length;
    const skip = (params.page - 1) * params.limit;
    const data = mapped.slice(skip, skip + params.limit);

    return {
      data,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async findByIdOrThrow(id: string) {
    const days = await this.settingsService.getExpiryWarningDays();
    const row = await this.prisma.fireExtinguisher.findUnique({
      where: { id },
      select: this.extinguisherSelect,
    });
    if (!row) throw new NotFoundException("Extinguisher not found");
    return toExtinguisher(row, days);
  }

  async findForCustomerUser(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new NotFoundException("Customer profile not found");

    const days = await this.settingsService.getExpiryWarningDays();
    const rows = await this.prisma.fireExtinguisher.findMany({
      where: { customerId: customer.id, status: "assigned" },
      orderBy: { expiryDate: "asc" },
      select: this.extinguisherSelect,
    });

    return rows.map((row) => toExtinguisher(row, days));
  }

  async create(dto: CreateExtinguisherDto) {
    const existing = await this.prisma.fireExtinguisher.findUnique({
      where: { serialNumber: dto.serialNumber },
    });
    if (existing) throw new ConflictException("Serial number already exists");

    const days = await this.settingsService.getExpiryWarningDays();
    const row = await this.prisma.fireExtinguisher.create({
      data: {
        serialNumber: dto.serialNumber,
        type: dto.type,
        manufactureDate: this.parseDate(dto.manufactureDate, "manufactureDate"),
        expiryDate: this.parseDate(dto.expiryDate, "expiryDate"),
      },
      select: this.extinguisherSelect,
    });

    return toExtinguisher(row, days);
  }

  async updateById(id: string, dto: UpdateExtinguisherDto) {
    await this.findByIdOrThrow(id);

    if (dto.serialNumber) {
      const conflict = await this.prisma.fireExtinguisher.findFirst({
        where: { serialNumber: dto.serialNumber, NOT: { id } },
      });
      if (conflict) throw new ConflictException("Serial number already exists");
    }

    const days = await this.settingsService.getExpiryWarningDays();
    const row = await this.prisma.fireExtinguisher.update({
      where: { id },
      data: {
        ...(dto.serialNumber ? { serialNumber: dto.serialNumber } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.manufactureDate
          ? { manufactureDate: this.parseDate(dto.manufactureDate, "manufactureDate") }
          : {}),
        ...(dto.expiryDate
          ? { expiryDate: this.parseDate(dto.expiryDate, "expiryDate") }
          : {}),
      },
      select: this.extinguisherSelect,
    });

    return toExtinguisher(row, days);
  }

  async deleteById(id: string) {
    const row = await this.prisma.fireExtinguisher.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Extinguisher not found");
    if (row.status === "assigned") {
      throw new BadRequestException("Cannot delete an assigned extinguisher. Unassign first.");
    }
    await this.prisma.fireExtinguisher.delete({ where: { id } });
    return { ok: true };
  }

  async assign(id: string, dto: AssignExtinguisherDto, performedById: string) {
    const extinguisher = await this.prisma.fireExtinguisher.findUnique({ where: { id } });
    if (!extinguisher) throw new NotFoundException("Extinguisher not found");
    if (extinguisher.status === "retired") {
      throw new BadRequestException("Cannot assign a retired extinguisher");
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const days = await this.settingsService.getExpiryWarningDays();

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.fireExtinguisher.update({
        where: { id },
        data: { customerId: dto.customerId, status: "assigned" },
        select: this.extinguisherSelect,
      });

      await tx.assignmentHistory.create({
        data: {
          extinguisherId: id,
          customerId: dto.customerId,
          action: "assigned",
          notes: dto.notes ?? "",
          performedById,
        },
      });

      return updated;
    });

    return toExtinguisher(row, days);
  }

  async unassign(id: string, performedById: string, notes?: string) {
    const extinguisher = await this.prisma.fireExtinguisher.findUnique({ where: { id } });
    if (!extinguisher) throw new NotFoundException("Extinguisher not found");
    if (!extinguisher.customerId) {
      throw new BadRequestException("Extinguisher is not assigned");
    }

    const days = await this.settingsService.getExpiryWarningDays();
    const previousCustomerId = extinguisher.customerId;

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.fireExtinguisher.update({
        where: { id },
        data: { customerId: null, status: "available" },
        select: this.extinguisherSelect,
      });

      await tx.assignmentHistory.create({
        data: {
          extinguisherId: id,
          customerId: previousCustomerId,
          action: "unassigned",
          notes: notes ?? "",
          performedById,
        },
      });

      return updated;
    });

    return toExtinguisher(row, days);
  }

  private async runReplace(
    tx: Prisma.TransactionClient,
    id: string,
    dto: ReplaceExtinguisherDto,
    performedById: string,
  ) {
    const oldExtinguisher = await tx.fireExtinguisher.findUnique({ where: { id } });
    if (!oldExtinguisher) throw new NotFoundException("Extinguisher not found");
    if (!oldExtinguisher.customerId) {
      throw new BadRequestException("Extinguisher must be assigned before replacement");
    }

    const newExtinguisher = await tx.fireExtinguisher.findUnique({
      where: { id: dto.newExtinguisherId },
    });
    if (!newExtinguisher) throw new NotFoundException("Replacement extinguisher not found");
    if (newExtinguisher.status !== "available") {
      throw new BadRequestException("Replacement extinguisher must be available");
    }

    const customerId = oldExtinguisher.customerId;

    await tx.fireExtinguisher.update({
      where: { id },
      data: { customerId: null, status: "retired" },
    });

    await tx.assignmentHistory.create({
      data: {
        extinguisherId: id,
        customerId,
        action: "replaced",
        notes: dto.notes ?? "Replaced with new unit",
        performedById,
      },
    });

    const updated = await tx.fireExtinguisher.update({
      where: { id: dto.newExtinguisherId },
      data: { customerId, status: "assigned" },
      select: this.extinguisherSelect,
    });

    await tx.assignmentHistory.create({
      data: {
        extinguisherId: dto.newExtinguisherId,
        customerId,
        action: "assigned",
        notes: dto.notes ?? `Replacement for ${oldExtinguisher.serialNumber}`,
        performedById,
      },
    });

    return updated;
  }

  async replace(
    id: string,
    dto: ReplaceExtinguisherDto,
    performedById: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const days = await this.settingsService.getExpiryWarningDays();

    const row = txClient
      ? await this.runReplace(txClient, id, dto, performedById)
      : await this.prisma.$transaction((tx) => this.runReplace(tx, id, dto, performedById));

    return toExtinguisher(row, days);
  }

  async getAdminAlerts() {
    const warningDays = await this.settingsService.getExpiryWarningDays();
    const today = startOfDay(new Date());
    const warningStart = new Date(today);
    warningStart.setDate(warningStart.getDate() + warningDays);

    const assigned = await this.prisma.fireExtinguisher.findMany({
      where: { status: "assigned" },
      select: this.extinguisherSelect,
    });

    const expiringSoon = assigned.filter((row) => {
      const status = getExtinguisherLifecycleStatus(row.expiryDate, warningDays);
      return status === "expiring_soon";
    });

    const expired = assigned.filter((row) => {
      const status = getExtinguisherLifecycleStatus(row.expiryDate, warningDays);
      return status === "expired";
    });

    return {
      warningDays,
      expiringSoon: expiringSoon.map((row) => toExtinguisher(row, warningDays)),
      expired: expired.map((row) => toExtinguisher(row, warningDays)),
    };
  }

  assertCustomerOwnership(extinguisherCustomerId: string | null, customerId: string) {
    if (extinguisherCustomerId !== customerId) {
      throw new ForbiddenException("You do not have access to this extinguisher");
    }
  }
}
