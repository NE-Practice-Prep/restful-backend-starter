import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { EmailService } from "@shared/email/email.service";
import { toPublicExtinguisher } from "@shared/common/mappers/fire-extinguisher.mapper";
import { deriveComplianceStatus } from "@shared/common/utils/compliance.util";
import { coerceToDate } from "@shared/common/utils/date.util";
import { Role } from "@shared/common/enums/role.enum";
import {
  extinguisherLabel,
  notifyPersonnel,
} from "@shared/fire/notifications.helper";
import type { RegisterExtinguisherDto } from "./dto/register-extinguisher.dto";
import type { UpdateExtinguisherDto } from "./dto/update-extinguisher.dto";
import type { parseListExtinguishersQuery } from "./dto/list-extinguishers-query.dto";

type ListParams = ReturnType<typeof parseListExtinguishersQuery>;
type ScopedListParams = ListParams & { requestedByUserId: string; requestedByRole: string };

@Injectable()
export class ExtinguishersService {
  private readonly logger = new Logger(ExtinguishersService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  async register(dto: RegisterExtinguisherDto) {
    this.logger.log(
      `register: incoming payload ${JSON.stringify({
        serialNumber: dto.serialNumber,
        type: dto.type,
        size: dto.size,
        status: dto.status,
        siteId: dto.siteId,
        installedAt: dto.installedAt,
        expiresAt: dto.expiresAt,
        installedAtType: typeof dto.installedAt,
        expiresAtType: typeof dto.expiresAt,
      })}`,
    );

    try {
      const serial = dto.serialNumber.trim();

      const existing = await this.prisma.fireExtinguisher.findUnique({
        where: { serialNumber: serial },
      });
      if (existing) {
        this.logger.warn(`register: serial number already registered (${serial})`);
        throw new ConflictException("Serial number already registered");
      }

      if (dto.siteId) {
        await this.assertSiteExists(dto.siteId);
      }

      const installedAt = coerceToDate(dto.installedAt, "installedAt");
      const expiresAt = coerceToDate(dto.expiresAt, "expiresAt");

      const complianceStatus = deriveComplianceStatus(expiresAt);
      this.logger.debug(
        `register: derived complianceStatus=${complianceStatus} for expiresAt=${expiresAt.toISOString()}`,
      );

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
          installedAt,
          expiresAt,
          notes: dto.notes?.trim() ?? "",
        },
        include: { site: true },
      });

      this.logger.log(`register: created extinguisher id=${row.id} serial=${serial}`);
      return toPublicExtinguisher(row);
    } catch (error: unknown) {
      this.logger.error(
        `register: failed for serial=${dto.serialNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async list(params: ScopedListParams) {
    const isRegularUser = params.requestedByRole === Role.user;

    const where = {
      ...(isRegularUser ? { assignedToId: params.requestedByUserId } : {}),
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
    this.logger.log(
      `update: id=${id} payload ${JSON.stringify({
        ...dto,
        installedAtType: typeof dto.installedAt,
        expiresAtType: typeof dto.expiresAt,
      })}`,
    );

    try {
      await this.view(id);

      if (dto.siteId) {
        await this.assertSiteExists(dto.siteId);
      }

      const existing = await this.prisma.fireExtinguisher.findUnique({ where: { id } });

      const installedAt =
        dto.installedAt === undefined
          ? undefined
          : coerceToDate(dto.installedAt, "installedAt");
      const expiresAt =
        dto.expiresAt === undefined ? undefined : coerceToDate(dto.expiresAt, "expiresAt");

      const effectiveExpiresAt = expiresAt ?? existing!.expiresAt;
      const complianceStatus = deriveComplianceStatus(effectiveExpiresAt);

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
          installedAt,
          expiresAt,
          notes: dto.notes?.trim(),
        },
        include: { site: true },
      });

      this.logger.log(`update: updated extinguisher id=${id}`);

      if (existing!.assignedToId) {
        const label = extinguisherLabel(row.serialNumber, row.location);
        const changes: string[] = [];
        if (dto.location !== undefined) changes.push(`location updated to "${row.location}"`);
        if (dto.status !== undefined) changes.push(`status updated to "${row.status}"`);
        if (dto.expiresAt !== undefined) {
          changes.push(`compliance status is now "${row.complianceStatus}"`);
        }
        if (changes.length > 0) {
          await notifyPersonnel(
            this.prisma,
            {
              type: "extinguisher_updated",
              title: "Your assigned extinguisher was updated",
              message: `Your assigned extinguisher (${label}) was updated: ${changes.join("; ")}.`,
              roles: [],
              userIds: [existing!.assignedToId],
            },
            this.email,
          );
        }
      }

      return toPublicExtinguisher(row);
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

  async assign(id: string, userId: string) {
    await this.view(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const row = await this.prisma.fireExtinguisher.update({
      where: { id },
      data: { assignedToId: userId },
      include: { site: true },
    });
    this.logger.log(`assign: extinguisher id=${id} assigned to userId=${userId}`);

    const label = extinguisherLabel(row.serialNumber, row.location);
    await notifyPersonnel(
      this.prisma,
      {
        type: "extinguisher_assigned",
        title: "Fire extinguisher assigned to you",
        message: `You have been assigned fire extinguisher ${label}. You will receive email updates when inspections, maintenance, compliance checks, or requests affect this extinguisher.`,
        roles: [],
        userIds: [userId],
      },
      this.email,
    );

    return toPublicExtinguisher(row);
  }

  async unassign(id: string) {
    const existing = await this.prisma.fireExtinguisher.findUnique({
      where: { id },
      select: { assignedToId: true, serialNumber: true, location: true },
    });
    if (!existing) throw new NotFoundException("Fire extinguisher not found");

    const row = await this.prisma.fireExtinguisher.update({
      where: { id },
      data: { assignedToId: null },
      include: { site: true },
    });
    this.logger.log(`unassign: extinguisher id=${id} unassigned`);

    if (existing.assignedToId) {
      const label = extinguisherLabel(existing.serialNumber, existing.location);
      await notifyPersonnel(
        this.prisma,
        {
          type: "extinguisher_unassigned",
          title: "Fire extinguisher unassigned",
          message: `You are no longer assigned to fire extinguisher ${label}.`,
          roles: [],
          userIds: [existing.assignedToId],
        },
        this.email,
      );
    }

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
