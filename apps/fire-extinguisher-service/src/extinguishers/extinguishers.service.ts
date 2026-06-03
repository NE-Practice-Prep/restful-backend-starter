import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { toPublicExtinguisher } from "@shared/common/mappers/fire-extinguisher.mapper";
import { deriveComplianceStatus } from "@shared/common/utils/compliance.util";
import type { RegisterExtinguisherDto } from "./dto/register-extinguisher.dto";
import type { UpdateExtinguisherDto } from "./dto/update-extinguisher.dto";
import type { parseListExtinguishersQuery } from "./dto/list-extinguishers-query.dto";

type ListParams = ReturnType<typeof parseListExtinguishersQuery>;

@Injectable()
export class ExtinguishersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async register(dto: RegisterExtinguisherDto) {
    const existing = await this.prisma.fireExtinguisher.findUnique({
      where: { serialNumber: dto.serialNumber.trim() },
    });
    if (existing) {
      throw new ConflictException("Serial number already registered");
    }

    if (dto.siteId) {
      await this.assertSiteExists(dto.siteId);
    }

    const complianceStatus = deriveComplianceStatus(dto.expiresAt);
    const serial = dto.serialNumber.trim();

    const row = await this.prisma.fireExtinguisher.create({
      data: {
        assetTag: serial,
        serialNumber: serial,
        location: dto.location.trim(),
        type: dto.type,
        size: dto.size,
        extinguisherClass: dto.type,
        siteId: dto.siteId ?? null,
        status: dto.status,
        complianceStatus,
        installedAt: dto.installedAt,
        expiresAt: dto.expiresAt,
        notes: dto.notes?.trim() ?? "",
      },
      include: { site: true },
    });

    return toPublicExtinguisher(row);
  }

  async list(params: ListParams) {
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.complianceStatus ? { complianceStatus: params.complianceStatus } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.q
        ? {
            OR: [
              { serialNumber: { contains: params.q, mode: "insensitive" as const } },
              { location: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.fireExtinguisher.count({ where }),
      this.prisma.fireExtinguisher.findMany({
        where,
        include: { site: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
    ]);

    return {
      data: rows.map(toPublicExtinguisher),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async view(id: string) {
    const row = await this.prisma.fireExtinguisher.findUnique({
      where: { id },
      include: { site: true },
    });
    if (!row) throw new NotFoundException("Fire extinguisher not found");
    return toPublicExtinguisher(row);
  }

  async update(id: string, dto: UpdateExtinguisherDto) {
    await this.view(id);

    if (dto.siteId) {
      await this.assertSiteExists(dto.siteId);
    }

    const existing = await this.prisma.fireExtinguisher.findUnique({ where: { id } });
    const expiresAt = dto.expiresAt ?? existing!.expiresAt;
    const complianceStatus = deriveComplianceStatus(expiresAt);

    const row = await this.prisma.fireExtinguisher.update({
      where: { id },
      data: {
        location: dto.location?.trim(),
        type: dto.type,
        size: dto.size,
        extinguisherClass: dto.type ?? undefined,
        siteId: dto.siteId === undefined ? undefined : dto.siteId,
        status: dto.status,
        complianceStatus,
        installedAt: dto.installedAt,
        expiresAt: dto.expiresAt,
        notes: dto.notes?.trim(),
      },
      include: { site: true },
    });

    return toPublicExtinguisher(row);
  }

  async remove(id: string) {
    await this.view(id);
    await this.prisma.fireExtinguisher.delete({ where: { id } });
    return { ok: true };
  }

  private async assertSiteExists(siteId: string) {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) throw new NotFoundException("Site not found");
  }
}
