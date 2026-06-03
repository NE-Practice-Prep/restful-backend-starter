import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { NOTIFICATIONS_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import type { ListNotificationsQueryDto } from "@shared/dto/list-notifications-query.dto";
import { NotificationsService } from "./notifications.service";

@Controller()
export class NotificationsMicroserviceController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  @MessagePattern(NOTIFICATIONS_PATTERNS.LIST)
  async list(@Payload() data: { user: AuthenticatedUser; query?: ListNotificationsQueryDto }) {
    try {
      return await this.notifications.list(data.user, data.query ?? {});
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERNS.MARK_READ)
  async markRead(@Payload() data: { user: AuthenticatedUser; notificationId: string }) {
    try {
      return await this.notifications.markRead(data.user, data.notificationId);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(NOTIFICATIONS_PATTERNS.MARK_UNREAD)
  async markUnread(@Payload() data: { user: AuthenticatedUser; notificationId: string }) {
    try {
      return await this.notifications.markUnread(data.user, data.notificationId);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
