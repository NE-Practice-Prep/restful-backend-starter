import {
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { NotificationDto } from "../common/dto/notification.dto";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

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
    return this.notifications.list(user, query);
  }

  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationDto })
  @ApiNotFoundResponse({ description: "Notification not found" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Patch(":id/read")
  markRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notifications.markRead(user, id);
  }

  @ApiOperation({ summary: "Mark a notification as unread" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationDto })
  @ApiNotFoundResponse({ description: "Notification not found" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Patch(":id/unread")
  markUnread(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notifications.markUnread(user, id);
  }
}
