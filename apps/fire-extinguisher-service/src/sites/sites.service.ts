import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { toPublicSite } from "@shared/common/mappers/fire-extinguisher.mapper";
import type { CreateSiteDto } from "./dto/create-site.dto";
import type { UpdateSiteDto } from "./dto/update-site.dto";
import type { parseListSitesQuery } from "./dto/list-sites-query.dto";

type ListParams = ReturnType<typeof parseListSitesQuery>;

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: CreateSiteDto) {
    this.logger.log(`create: incoming payload ${JSON.stringify(dto)}`);

    try {
      const code = dto.code?.trim() || null;
      if (code) {
        const existing = await this.prisma.site.findUnique({ where: { code } });
        if (existing) {
          throw new ConflictException("Site code already registered");
        }
      }

      const row = await this.prisma.site.create({
        data: {
          name: dto.name.trim(),
          code,
          address: dto.address?.trim() || null,
          city: dto.city?.trim() || null,
          state: dto.state?.trim() || null,
          postalCode: dto.postalCode?.trim() || null,
          country: dto.country?.trim() ?? "",
          isActive: dto.isActive ?? true,
        },
      });

      this.logger.log(`create: created site id=${row.id}`);
      return toPublicSite(row);
    } catch (error: unknown) {
      this.logger.error(
        `create: failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async list(params: ListParams) {
    const where = {
      ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" as const } },
              { code: { contains: params.q, mode: "insensitive" as const } },
              { city: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.site.count({ where }),
      this.prisma.site.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
    ]);

    return {
      data: rows.map(toPublicSite),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async view(id: string) {
    const row = await this.prisma.site.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Site not found");
    return toPublicSite(row);
  }

  async update(id: string, dto: UpdateSiteDto) {
    this.logger.log(`update: id=${id} payload ${JSON.stringify(dto)}`);

    try {
      await this.view(id);

      if (dto.code !== undefined && dto.code.trim()) {
        const code = dto.code.trim();
        const existing = await this.prisma.site.findFirst({
          where: { code, NOT: { id } },
        });
        if (existing) {
          throw new ConflictException("Site code already in use");
        }
      }

      const row = await this.prisma.site.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          code: dto.code === undefined ? undefined : dto.code.trim() || null,
          address: dto.address === undefined ? undefined : dto.address.trim() || null,
          city: dto.city === undefined ? undefined : dto.city.trim() || null,
          state: dto.state === undefined ? undefined : dto.state.trim() || null,
          postalCode:
            dto.postalCode === undefined ? undefined : dto.postalCode.trim() || null,
          country: dto.country?.trim(),
          isActive: dto.isActive,
        },
      });

      this.logger.log(`update: updated site id=${id}`);
      return toPublicSite(row);
    } catch (error: unknown) {
      this.logger.error(
        `update: failed for id=${id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string) {
    await this.view(id);
    await this.prisma.site.delete({ where: { id } });
    return { ok: true };
  }
}
