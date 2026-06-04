import {
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { NOTIFICATIONS_PATTERNS } from "@shared/microservices/patterns";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { ListNotificationsQueryDto } from "@shared/dto/list-notifications-query.dto";
import { NotificationDto } from "@shared/common/dto/notification.dto";
import { AUTH_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

/**
 * In-app notification HTTP routes for the authenticated user.
 * Handled by auth-service (notifications share its data store).
 */
@ApiTags("notifications")
@Controller("notifications")
export class NotificationsGatewayController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "List my system notifications" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationDto, isArray: true })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.proxy.send(this.authClient, NOTIFICATIONS_PATTERNS.LIST, { user, query });
  }

  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationDto })
  @ApiNotFoundResponse({ description: "Notification not found" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Patch(":id/read")
  markRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.proxy.send(this.authClient, NOTIFICATIONS_PATTERNS.MARK_READ, {
      user,
      notificationId: id,
    });
  }

  @ApiOperation({ summary: "Mark a notification as unread" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationDto })
  @ApiNotFoundResponse({ description: "Notification not found" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Patch(":id/unread")
  markUnread(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.proxy.send(this.authClient, NOTIFICATIONS_PATTERNS.MARK_UNREAD, {
      user,
      notificationId: id,
    });
  }
}
