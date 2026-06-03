import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { REPORTS_PATTERNS } from "@shared/microservices/patterns";
import { ROLE_POLICY } from "@shared/auth/role-policy";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { REPORTS_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("reports")
@Controller("reports")
export class ReportsGatewayController {
  constructor(
    @Inject(REPORTS_SERVICE) private readonly reportsClient: ClientProxy,
    @Inject(MicroserviceProxyService)
    private readonly proxy: MicroserviceProxyService,
  ) {}

  private actorFrom(user: AuthenticatedUser) {
    return { userId: user.sub, role: user.role };
  }

  @ApiOperation({ summary: "Role-specific dashboard overview KPIs" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.AUTHENTICATED)
  @Get("overview")
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.reportsClient, REPORTS_PATTERNS.OVERVIEW, {
      actor: this.actorFrom(user),
    });
  }

  @ApiOperation({ summary: "Inventory report (full for admin/editor, summary for viewer)" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.AUTHENTICATED)
  @Get("inventory")
  inventory(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.reportsClient, REPORTS_PATTERNS.INVENTORY, {
      actor: this.actorFrom(user),
    });
  }

  @ApiOperation({ summary: "Inspections report" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.AUTHENTICATED)
  @Get("inspections")
  inspections(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.reportsClient, REPORTS_PATTERNS.INSPECTIONS, {
      actor: this.actorFrom(user),
    });
  }

  @ApiOperation({ summary: "Compliance report (all roles)" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.AUTHENTICATED)
  @Get("compliance")
  compliance(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.reportsClient, REPORTS_PATTERNS.COMPLIANCE, {
      actor: this.actorFrom(user),
    });
  }

  @ApiOperation({ summary: "Maintenance report (admin/editor only)" })
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Maintenance aggregates for dashboard KPIs" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Viewers cannot access maintenance reports" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.AUTHENTICATED)
  @Get("maintenance")
  maintenance(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.reportsClient, REPORTS_PATTERNS.MAINTENANCE, {
      actor: this.actorFrom(user),
    });
  }
}
