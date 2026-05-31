import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../common/enums/role.enum";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { ApproveRenewalDto, RejectRenewalDto, SubmitRenewalDto } from "./dto/renewal.dto";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: "List in-app notifications for current user" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query("unreadOnly") unreadOnly?: string) {
    return this.notificationsService.listForUser(user.sub, unreadOnly === "true");
  }

  @ApiOperation({ summary: "Unread notification count" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("unread-count")
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.unreadCount(user.sub);
  }

  @ApiOperation({ summary: "Mark notification as read" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(":id/read")
  markRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("read-all")
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @ApiOperation({ summary: "Admin notifications dashboard" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get("admin/dashboard")
  adminDashboard() {
    return this.notificationsService.getAdminDashboard();
  }

  @ApiOperation({ summary: "Submit renewal request (customer)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @Post("renewals")
  submitRenewal(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitRenewalDto) {
    return this.notificationsService.submitRenewalRequest(user.sub, dto.extinguisherId);
  }

  @ApiOperation({ summary: "List my renewal requests (customer)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @Get("renewals/mine")
  myRenewals(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getMyRenewalRequests(user.sub);
  }

  @ApiOperation({ summary: "List renewal requests (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get("renewals")
  listRenewals(@Query("status") status?: string) {
    return this.notificationsService.listRenewalRequests(status);
  }

  @ApiOperation({ summary: "Approve renewal request (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post("renewals/:id/approve")
  approveRenewal(
    @Param("id") id: string,
    @Body() dto: ApproveRenewalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.approveRenewalRequest(
      id,
      dto.replacementExtinguisherId,
      user.sub,
      dto.adminNote,
    );
  }

  @ApiOperation({ summary: "Reject renewal request (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post("renewals/:id/reject")
  rejectRenewal(@Param("id") id: string, @Body() dto: RejectRenewalDto) {
    return this.notificationsService.rejectRenewalRequest(id, dto.adminNote);
  }
}
