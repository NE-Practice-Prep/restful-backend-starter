import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import { REPORTING_PATTERNS } from "@shared/microservices/patterns";
import { Role } from "@shared/common/enums/role.enum";
import { REPORTING_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

/**
 * Aggregated analytics and dashboard HTTP routes.
 * Proxies read-only queries to reporting-service (admin and inspector only).
 */
@ApiTags("reporting")
@Controller("reporting")
export class ReportingGatewayController {
  constructor(
    @Inject(REPORTING_SERVICE) private readonly reportingClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({
    summary: "Real-time stock summary — totals by status, type, compliance, assignment",
  })
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: "Requires admin or inspector role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Get("stock/summary")
  stockSummary() {
    return this.proxy.send(this.reportingClient, REPORTING_PATTERNS.STOCK_SUMMARY, {});
  }

  @ApiOperation({
    summary: "Stock trend over time — daily (30 days), monthly (12 months), yearly (5 years)",
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: "period",
    enum: ["daily", "monthly", "yearly"],
    required: false,
    description: "Aggregation period (default: monthly)",
  })
  @ApiForbiddenResponse({ description: "Requires admin or inspector role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Get("stock/trend")
  stockTrend(@Query("period") period?: string) {
    // Coerce unknown period values to the default before RPC.
    const validated =
      period === "daily" || period === "yearly" ? period : "monthly";
    return this.proxy.send(this.reportingClient, REPORTING_PATTERNS.STOCK_TREND, {
      period: validated,
    });
  }

  @ApiOperation({
    summary: "Inspection status report — overdue counts, upcoming, result breakdown, recent completions",
  })
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: "Requires admin or inspector role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Get("inspections/status")
  inspectionStatus() {
    return this.proxy.send(
      this.reportingClient,
      REPORTING_PATTERNS.INSPECTION_STATUS,
      {},
    );
  }

  @ApiOperation({
    summary: "Expired & expiring-soon extinguishers — groups by expired, 30-day, 90-day windows",
  })
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: "Requires admin or inspector role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Get("extinguishers/expired")
  expiredExtinguishers() {
    return this.proxy.send(
      this.reportingClient,
      REPORTING_PATTERNS.EXPIRED_EXTINGUISHERS,
      {},
    );
  }

  @ApiOperation({
    summary: "Maintenance history report — paginated log with type breakdown",
  })
  @ApiBearerAuth()
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "extinguisherId", required: false, type: String })
  @ApiQuery({
    name: "since",
    required: false,
    type: String,
    description: "ISO date string to filter records from",
  })
  @ApiForbiddenResponse({ description: "Requires admin or inspector role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Get("maintenance/history")
  maintenanceHistory(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("extinguisherId") extinguisherId?: string,
    @Query("since") since?: string,
  ) {
    // Clamp pagination in the gateway so invalid query strings cannot bypass service limits.
    return this.proxy.send(
      this.reportingClient,
      REPORTING_PATTERNS.MAINTENANCE_HISTORY,
      {
        page: Math.max(1, Number(page ?? 1) || 1),
        limit: Math.min(100, Math.max(1, Number(limit ?? 20) || 20)),
        extinguisherId,
        since,
      },
    );
  }
}
