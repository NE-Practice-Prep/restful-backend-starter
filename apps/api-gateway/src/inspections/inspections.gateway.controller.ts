import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { INSPECTIONS_PATTERNS } from "@shared/microservices/patterns";
import { ROLE_POLICY } from "@shared/auth/role-policy";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { INSPECTIONS_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ScheduleInspectionDto } from "./dto/schedule-inspection.dto";
import { CompleteInspectionDto } from "./dto/complete-inspection.dto";
import { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
import {
  ListInspectionsQueryDto,
  ListMaintenanceQueryDto,
  parseListInspectionsQuery,
  parseListMaintenanceQuery,
} from "./dto/list-inspections-query.dto";

@ApiTags("inspections")
@Controller("inspections")
export class InspectionsGatewayController {
  constructor(
    @Inject(INSPECTIONS_SERVICE) private readonly inspectionsClient: ClientProxy,
    @Inject(MicroserviceProxyService)
    private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Schedule an inspection" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.ALL_ROLES)
  @Post()
  schedule(@CurrentUser() user: AuthenticatedUser, @Body() dto: ScheduleInspectionDto) {
    return this.proxy.send(this.inspectionsClient, INSPECTIONS_PATTERNS.SCHEDULE, {
      dto,
      actor: { userId: user.sub, role: user.role },
    });
  }

  @ApiOperation({ summary: "List inspections" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.ALL_ROLES)
  @Get()
  findAll(@Query() query: ListInspectionsQueryDto) {
    return this.proxy.send(
      this.inspectionsClient,
      INSPECTIONS_PATTERNS.FIND_ALL,
      parseListInspectionsQuery(query),
    );
  }

  @ApiOperation({ summary: "List maintenance logs" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.ALL_ROLES)
  @Get("maintenance")
  findMaintenance(@Query() query: ListMaintenanceQueryDto) {
    return this.proxy.send(
      this.inspectionsClient,
      INSPECTIONS_PATTERNS.FIND_MAINTENANCE,
      parseListMaintenanceQuery(query),
    );
  }

  @ApiOperation({ summary: "Get inspection by ID" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.ALL_ROLES)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.proxy.send(this.inspectionsClient, INSPECTIONS_PATTERNS.FIND_ONE, { id });
  }

  @ApiOperation({ summary: "Complete an inspection" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.INSPECTOR_UP)
  @Post(":id/complete")
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CompleteInspectionDto,
  ) {
    return this.proxy.send(this.inspectionsClient, INSPECTIONS_PATTERNS.COMPLETE, {
      id,
      dto,
      actor: { userId: user.sub, role: user.role },
    });
  }

  @ApiOperation({ summary: "Cancel an inspection" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.INSPECTOR_UP)
  @Post(":id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.proxy.send(this.inspectionsClient, INSPECTIONS_PATTERNS.CANCEL, {
      id,
      actor: { userId: user.sub, role: user.role },
    });
  }

  @ApiOperation({ summary: "Log a maintenance activity" })
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.INSPECTOR_UP)
  @Post("maintenance")
  createMaintenance(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMaintenanceDto) {
    return this.proxy.send(this.inspectionsClient, INSPECTIONS_PATTERNS.CREATE_MAINTENANCE, {
      dto,
      actor: { userId: user.sub, role: user.role },
    });
  }
}
