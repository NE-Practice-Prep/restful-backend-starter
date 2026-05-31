import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CustomersService } from "../customers/customers.service";
import { ExtinguishersService } from "../extinguishers/extinguishers.service";
import { SettingsService } from "../settings/settings.service";
import { EmailService } from "../email/email.service";
import { toNotification } from "../common/mappers/notification.mapper";
import { toRenewalRequest } from "../common/mappers/renewal.mapper";
import { getExtinguisherLifecycleStatus } from "../common/utils/extinguisher-status.util";

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CustomersService) private readonly customersService: CustomersService,
    @Inject(ExtinguishersService) private readonly extinguishersService: ExtinguishersService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(EmailService) private readonly email: EmailService,
  ) {}

  async listForUser(userId: string, unreadOnly = false) {
    const rows = await this.prisma.inAppNotification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return rows.map(toNotification);
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.inAppNotification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    const row = await this.prisma.inAppNotification.findUnique({
      where: { id: notificationId },
    });
    if (!row || row.userId !== userId) {
      throw new NotFoundException("Notification not found");
    }

    const updated = await this.prisma.inAppNotification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return toNotification(updated);
  }

  async markAllRead(userId: string) {
    await this.prisma.inAppNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { ok: true };
  }

  async createNotification(params: {
    userId: string;
    type: "expiring_soon" | "expired" | "renewal_approved" | "renewal_rejected";
    title: string;
    message: string;
    extinguisherId?: string;
    renewalRequestId?: string;
  }) {
    const existing = params.extinguisherId
      ? await this.prisma.inAppNotification.findFirst({
          where: {
            userId: params.userId,
            type: params.type,
            extinguisherId: params.extinguisherId,
            read: false,
          },
        })
      : null;

    if (existing) return toNotification(existing);

    const row = await this.prisma.inAppNotification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        extinguisherId: params.extinguisherId,
        renewalRequestId: params.renewalRequestId,
      },
    });

    return toNotification(row);
  }

  async listRenewalRequests(status?: string) {
    const renewalInclude = {
      customer: { select: { id: true, name: true, email: true } },
      extinguisher: {
        select: { id: true, serialNumber: true, type: true, expiryDate: true },
      },
      replacementExtinguisher: {
        select: { id: true, serialNumber: true, type: true, expiryDate: true },
      },
    } as const;

    const rows = await this.prisma.renewalRequest.findMany({
      where: status && status !== "all" ? { status: status as "pending" } : undefined,
      orderBy: { createdAt: "desc" },
      include: renewalInclude,
    });

    return rows.map(toRenewalRequest);
  }

  async submitRenewalRequest(userId: string, extinguisherId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new NotFoundException("Customer profile not found");

    const extinguisher = await this.prisma.fireExtinguisher.findUnique({
      where: { id: extinguisherId },
    });
    if (!extinguisher) throw new NotFoundException("Extinguisher not found");
    this.extinguishersService.assertCustomerOwnership(extinguisher.customerId, customer.id);

    const warningDays = await this.settingsService.getExpiryWarningDays();
    const lifecycle = getExtinguisherLifecycleStatus(extinguisher.expiryDate, warningDays);
    if (lifecycle === "active") {
      throw new BadRequestException("Renewal can only be requested for expiring or expired units");
    }

    const existingPending = await this.prisma.renewalRequest.findFirst({
      where: {
        customerId: customer.id,
        extinguisherId,
        status: "pending",
      },
    });
    if (existingPending) {
      throw new BadRequestException("A pending renewal request already exists for this unit");
    }

    const row = await this.prisma.renewalRequest.create({
      data: {
        customerId: customer.id,
        extinguisherId,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        extinguisher: {
          select: { id: true, serialNumber: true, type: true, expiryDate: true },
        },
      },
    });

    return toRenewalRequest(row);
  }

  async getMyRenewalRequests(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new NotFoundException("Customer profile not found");

    const rows = await this.prisma.renewalRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        extinguisher: {
          select: { id: true, serialNumber: true, type: true, expiryDate: true },
        },
        replacementExtinguisher: {
          select: { id: true, serialNumber: true, type: true, expiryDate: true },
        },
      },
    });

    return rows.map(toRenewalRequest);
  }

  async approveRenewalRequest(
    requestId: string,
    replacementExtinguisherId: string,
    adminUserId: string,
    adminNote?: string,
  ) {
    const request = await this.prisma.renewalRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: { include: { user: true } },
        extinguisher: true,
      },
    });

    if (!request) throw new NotFoundException("Renewal request not found");
    if (request.status !== "pending") {
      throw new BadRequestException("Only pending requests can be approved");
    }

    const row = await this.prisma.$transaction(async (tx) => {
      await this.extinguishersService.replace(
        request.extinguisherId,
        {
          newExtinguisherId: replacementExtinguisherId,
          notes: adminNote ?? "Approved renewal replacement",
        },
        adminUserId,
        tx,
      );

      return tx.renewalRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          replacementExtinguisherId,
          adminNote: adminNote ?? "",
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          extinguisher: {
            select: { id: true, serialNumber: true, type: true, expiryDate: true },
          },
          replacementExtinguisher: {
            select: { id: true, serialNumber: true, type: true, expiryDate: true },
          },
        },
      });
    });

    if (request.customer.userId) {
      await this.createNotification({
        userId: request.customer.userId,
        type: "renewal_approved",
        title: "Renewal approved",
        message: `Your renewal for ${request.extinguisher.serialNumber} was approved. A replacement unit has been assigned.`,
        extinguisherId: replacementExtinguisherId,
        renewalRequestId: requestId,
      });
    }

    return toRenewalRequest(row);
  }

  async rejectRenewalRequest(requestId: string, adminNote?: string) {
    const request = await this.prisma.renewalRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: { include: { user: true } },
        extinguisher: true,
      },
    });

    if (!request) throw new NotFoundException("Renewal request not found");
    if (request.status !== "pending") {
      throw new BadRequestException("Only pending requests can be rejected");
    }

    const row = await this.prisma.renewalRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        adminNote: adminNote ?? "",
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        extinguisher: {
          select: { id: true, serialNumber: true, type: true, expiryDate: true },
        },
      },
    });

    if (request.customer.userId) {
      await this.createNotification({
        userId: request.customer.userId,
        type: "renewal_rejected",
        title: "Renewal rejected",
        message: adminNote
          ? `Your renewal for ${request.extinguisher.serialNumber} was rejected: ${adminNote}`
          : `Your renewal for ${request.extinguisher.serialNumber} was rejected.`,
        extinguisherId: request.extinguisherId,
        renewalRequestId: requestId,
      });
    }

    return toRenewalRequest(row);
  }

  async getAdminDashboard() {
    const alerts = await this.extinguishersService.getAdminAlerts();
    const renewalRequests = await this.listRenewalRequests("pending");

    return {
      ...alerts,
      pendingRenewals: renewalRequests,
    };
  }
}
