import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { OkResponseDto } from "@shared/common/dto/ok-response.dto";

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { Role } from "@shared/common/enums/role.enum";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { FIRE_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ScheduleInspectionDto } from "./dto/schedule-inspection.dto";
import {
  CompleteInspectionDto,
  UpdateInspectionDto,
} from "./dto/complete-inspection.dto";
import {
  ListInspectionsQueryDto,
  parseListInspectionsQuery,
} from "./dto/list-inspections-query.dto";

/**
 * Inspection scheduling and completion HTTP routes.
 * Proxies to fire-extinguisher-service; visibility follows caller role on list/view.
 */
@ApiTags("inspections")
@Controller("inspections")
export class InspectionsGatewayController {
  constructor(
    @Inject(FIRE_SERVICE) private readonly fireClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Schedule an inspection (notifies personnel)" })
  @ApiBearerAuth()
  @ApiBody({ type: ScheduleInspectionDto })
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector, Role.user)
  @Post("schedule")
  schedule(@CurrentUser() user: AuthenticatedUser, @Body() dto: ScheduleInspectionDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.INSPECTION_SCHEDULE, {
      dto,
      requestedById: user.sub,
    });
  }

  @ApiOperation({
    summary: "List inspections — admins/inspectors see all, users see only their assigned extinguishers",
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListInspectionsQueryDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.INSPECTION_LIST, {
      ...parseListInspectionsQuery(query),
      requestedByUserId: user.sub,
      requestedByRole: user.role,
    });
  }

  @ApiOperation({ summary: "View inspection" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  view(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.INSPECTION_VIEW, {
      id,
      requestedByUserId: user.sub,
      requestedByRole: user.role,
    });
  }

  @ApiOperation({ summary: "Log inspection results" })
  @ApiBearerAuth()
  @ApiBody({ type: CompleteInspectionDto })
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Post(":id/complete")
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CompleteInspectionDto,
  ) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.INSPECTION_COMPLETE, {
      id,
      inspectorId: user.sub,
      dto,
    });
  }

  @ApiOperation({ summary: "Update scheduled inspection" })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateInspectionDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateInspectionDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.INSPECTION_UPDATE, { id, dto });
  }

  @ApiOperation({ summary: "Delete an inspection record" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.INSPECTION_REMOVE, { id });
  }
}
