import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import { EmailService } from "@shared/email/email.service";
import { RequestStatus } from "@shared/generated/prisma/enums";
import {
  extinguisherLabel,
  notifyExtinguisherAssignee,
  notifyPersonnel,
} from "@shared/fire/notifications.helper";
import { Role } from "@shared/common/enums/role.enum";
import type { CreateRequestDto } from "./dto/create-request.dto";
import type { ReviewRequestDto } from "./dto/review-request.dto";

@Injectable()
export class RequestsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  async create(requestedById: string, dto: CreateRequestDto) {
    if (dto.extinguisherId) {
      const ext = await this.prisma.fireExtinguisher.findUnique({
        where: { id: dto.extinguisherId },
      });
      if (!ext) throw new NotFoundException("Fire extinguisher not found");
    }

    const row = await this.prisma.extinguisherRequest.create({
      data: {
        requestedById,
        extinguisherId: dto.extinguisherId ?? null,
        quantity: dto.quantity ?? 1,
        type: dto.type ?? null,
        size: dto.size ?? null,
        notes: dto.notes?.trim() ?? "",
        status: RequestStatus.pending,
      },
      include: this.requestInclude,
    });

    await notifyPersonnel(
      this.prisma,
      {
        type: "extinguisher_request",
        title: "New extinguisher request",
        message: `A new extinguisher request has been submitted and requires review.`,
        roles: [Role.admin],
        userIds: [],
      },
      this.email,
    );

    await notifyPersonnel(
      this.prisma,
      {
        type: "extinguisher_request_submitted",
        title: "Your extinguisher request was submitted",
        message: `Your extinguisher request has been submitted and is pending review.`,
        roles: [],
        userIds: [requestedById],
      },
      this.email,
    );

    if (dto.extinguisherId) {
      const ext = await this.prisma.fireExtinguisher.findUnique({
        where: { id: dto.extinguisherId },
        select: { serialNumber: true, location: true },
      });
      if (ext) {
        await notifyExtinguisherAssignee(
          this.prisma,
          dto.extinguisherId,
          {
            type: "extinguisher_request_submitted",
            title: "Request submitted for your extinguisher",
            message: `A request has been submitted regarding your assigned extinguisher (${extinguisherLabel(ext.serialNumber, ext.location)}). It is pending review.`,
          },
          this.email,
          { excludeUserIds: [requestedById] },
        );
      }
    }

    return this.toPublicRequest(row);
  }

  async list(params: { page: number; limit: number; status?: RequestStatus }) {
    const where = params.status ? { status: params.status } : {};
    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.extinguisherRequest.count({ where }),
      this.prisma.extinguisherRequest.findMany({
        where,
        include: this.requestInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
    ]);

    return {
      data: rows.map((r) => this.toPublicRequest(r)),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async myList(requestedById: string, params: { page: number; limit: number; status?: RequestStatus }) {
    const where = { requestedById, ...(params.status ? { status: params.status } : {}) };
    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await Promise.all([
      this.prisma.extinguisherRequest.count({ where }),
      this.prisma.extinguisherRequest.findMany({
        where,
        include: this.requestInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
    ]);

    return {
      data: rows.map((r) => this.toPublicRequest(r)),
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  async view(id: string) {
    const row = await this.prisma.extinguisherRequest.findUnique({
      where: { id },
      include: this.requestInclude,
    });
    if (!row) throw new NotFoundException("Extinguisher request not found");
    return this.toPublicRequest(row);
  }

  async approve(id: string, reviewedById: string, dto: ReviewRequestDto) {
    const row = await this.prisma.extinguisherRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Extinguisher request not found");
    if (row.status !== RequestStatus.pending) {
      throw new BadRequestException("Only pending requests can be approved");
    }

    const updated = await this.prisma.extinguisherRequest.update({
      where: { id },
      data: {
        status: RequestStatus.approved,
        reviewedById,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes?.trim() ?? "",
      },
      include: this.requestInclude,
    });

    await notifyPersonnel(
      this.prisma,
      {
        type: "request_approved",
        title: "Extinguisher request approved",
        message: `Your extinguisher request has been approved.${dto.reviewNotes ? ` Notes: ${dto.reviewNotes}` : ""}`,
        roles: [],
        userIds: [row.requestedById],
      },
      this.email,
    );

    if (row.extinguisherId) {
      await notifyExtinguisherAssignee(
        this.prisma,
        row.extinguisherId,
        {
          type: "request_approved",
          title: "Extinguisher request approved",
          message: `A request related to your assigned extinguisher has been approved.${dto.reviewNotes ? ` Notes: ${dto.reviewNotes}` : ""}`,
        },
        this.email,
        { excludeUserIds: [row.requestedById] },
      );
    }

    return this.toPublicRequest(updated);
  }

  async reject(id: string, reviewedById: string, dto: ReviewRequestDto) {
    const row = await this.prisma.extinguisherRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Extinguisher request not found");
    if (row.status !== RequestStatus.pending) {
      throw new BadRequestException("Only pending requests can be rejected");
    }

    const updated = await this.prisma.extinguisherRequest.update({
      where: { id },
      data: {
        status: RequestStatus.rejected,
        reviewedById,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes?.trim() ?? "",
      },
      include: this.requestInclude,
    });

    await notifyPersonnel(
      this.prisma,
      {
        type: "request_rejected",
        title: "Extinguisher request rejected",
        message: `Your extinguisher request has been rejected.${dto.reviewNotes ? ` Reason: ${dto.reviewNotes}` : ""}`,
        roles: [],
        userIds: [row.requestedById],
      },
      this.email,
    );

    if (row.extinguisherId) {
      await notifyExtinguisherAssignee(
        this.prisma,
        row.extinguisherId,
        {
          type: "request_rejected",
          title: "Extinguisher request rejected",
          message: `A request related to your assigned extinguisher has been rejected.${dto.reviewNotes ? ` Reason: ${dto.reviewNotes}` : ""}`,
        },
        this.email,
        { excludeUserIds: [row.requestedById] },
      );
    }

    return this.toPublicRequest(updated);
  }

  async cancel(id: string, requestedById: string, isAdmin: boolean) {
    const row = await this.prisma.extinguisherRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Extinguisher request not found");

    if (!isAdmin && row.requestedById !== requestedById) {
      throw new ForbiddenException("You can only cancel your own requests");
    }

    if (row.status !== RequestStatus.pending) {
      throw new BadRequestException("Only pending requests can be cancelled");
    }

    const updated = await this.prisma.extinguisherRequest.update({
      where: { id },
      data: { status: RequestStatus.cancelled },
      include: this.requestInclude,
    });

    return this.toPublicRequest(updated);
  }

  private get requestInclude() {
    return {
      requestedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      reviewedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      extinguisher: {
        select: { id: true, serialNumber: true, location: true },
      },
    } as const;
  }

  private toPublicRequest(row: {
    id: string;
    requestedById: string;
    requestedBy: { id: string; email: string; firstName: string; lastName: string };
    extinguisherId: string | null;
    extinguisher: { id: string; serialNumber: string; location: string } | null;
    quantity: number;
    type: string | null;
    size: string | null;
    notes: string;
    status: string;
    reviewedById: string | null;
    reviewedBy: { id: string; email: string; firstName: string; lastName: string } | null;
    reviewedAt: Date | null;
    reviewNotes: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      requestedById: row.requestedById,
      requestedBy: row.requestedBy,
      extinguisherId: row.extinguisherId,
      extinguisher: row.extinguisher,
      quantity: row.quantity,
      type: row.type,
      size: row.size,
      notes: row.notes,
      status: row.status,
      reviewedById: row.reviewedById,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewNotes: row.reviewNotes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
