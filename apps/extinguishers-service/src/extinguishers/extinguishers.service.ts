/**
 * Fire extinguisher CRUD + RBAC: inspectors/admins write, everyone authenticated can read.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { Role } from "@shared/common/enums/role.enum";
import { isInspectorRole } from "@shared/auth/role-policy";
import type { RpcUserContext } from "@shared/types/rpc-context.type";
import type { CreateExtinguisherDto } from "./dto/create-extinguisher.dto";
import type { UpdateExtinguisherDto } from "./dto/update-extinguisher.dto";
import type { parseListExtinguishersQuery } from "./dto/list-extinguishers-query.dto";

type ListExtinguishersParams = ReturnType<typeof parseListExtinguishersQuery>;

@Injectable()
export class ExtinguishersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private assertCanWrite(actor: RpcUserContext) {
    if (!isInspectorRole(actor.role)) {
      throw new ForbiddenException("You do not have permission to modify extinguishers");
    }
  }

  private assertAdmin(actor: RpcUserContext) {
    if (actor.role !== Role.admin) {
      throw new ForbiddenException("Only administrators can delete extinguishers");
    }
  }

  private validateDates(installationDate: Date, expiryDate: Date) {
    if (expiryDate < installationDate) {
      throw new BadRequestException("Expiry date must be on or after installation date");
    }
  }

  async create(dto: CreateExtinguisherDto, actor: RpcUserContext) {
    this.assertCanWrite(actor);
    const existing = await this.prisma.fireExtinguisher.findUnique({
      where: { serialNumber: dto.serialNumber },
    });
    if (existing) throw new ConflictException("Serial number already registered");

    const installationDate = new Date(dto.installationDate);
    const expiryDate = new Date(dto.expiryDate);
    this.validateDates(installationDate, expiryDate);

    return this.prisma.fireExtinguisher.create({
      data: {
        serialNumber: dto.serialNumber,
        location: dto.location,
        type: dto.type,
        size: dto.size,
        installationDate,
        expiryDate,
        status: dto.status,
      },
    });
  }

  async findAll(query: ListExtinguishersParams) {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.q
        ? {
            OR: [
              { serialNumber: { contains: query.q, mode: "insensitive" as const } },
              { location: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.fireExtinguisher.count({ where }),
      this.prisma.fireExtinguisher.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
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
    const item = await this.prisma.fireExtinguisher.findUnique({
      where: { id },
      include: {
        inspections: { orderBy: { scheduledDate: "desc" }, take: 10 },
        maintenanceLogs: { orderBy: { maintenanceDate: "desc" }, take: 10 },
      },
    });
    if (!item) throw new NotFoundException("Fire extinguisher not found");
    return item;
  }

  async update(id: string, dto: UpdateExtinguisherDto, actor: RpcUserContext) {
    this.assertCanWrite(actor);
    await this.findOne(id);

    const installationDate = dto.installationDate ? new Date(dto.installationDate) : undefined;
    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : undefined;
    if (installationDate && expiryDate) {
      this.validateDates(installationDate, expiryDate);
    }

    return this.prisma.fireExtinguisher.update({
      where: { id },
      data: {
        ...(dto.serialNumber ? { serialNumber: dto.serialNumber } : {}),
        ...(dto.location ? { location: dto.location } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.size ? { size: dto.size } : {}),
        ...(installationDate ? { installationDate } : {}),
        ...(expiryDate ? { expiryDate } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async delete(id: string, actor: RpcUserContext) {
    this.assertAdmin(actor);
    await this.findOne(id);
    await this.prisma.fireExtinguisher.delete({ where: { id } });
    return { ok: true };
  }
}
