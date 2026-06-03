import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@shared/prisma/prisma.service";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import type { ListNotificationsQueryDto } from "@shared/dto/list-notifications-query.dto";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(currentUser: AuthenticatedUser, query: ListNotificationsQueryDto = {}) {
    this.logger.debug(
      `Listing notifications for user ${currentUser.sub}${query.unreadOnly ? " (unread only)" : ""}`,
    );
    return this.prisma.notification.findMany({
      where: {
        userId: currentUser.sub,
        ...(query.unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async markRead(currentUser: AuthenticatedUser, notificationId: string) {
    this.logger.log(`Mark notification read: ${notificationId} for user ${currentUser.sub}`);
    return this.updateReadState(currentUser.sub, notificationId, true);
  }

  async markUnread(currentUser: AuthenticatedUser, notificationId: string) {
    this.logger.log(`Mark notification unread: ${notificationId} for user ${currentUser.sub}`);
    return this.updateReadState(currentUser.sub, notificationId, false);
  }

  private async updateReadState(userId: string, notificationId: string, read: boolean) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.read === read) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read },
    });
  }
}
