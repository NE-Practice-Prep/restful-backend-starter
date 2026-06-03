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
} from "@nestjs/swagger";

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { OkResponseDto } from "@shared/common/dto/ok-response.dto";
import { Role } from "@shared/common/enums/role.enum";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { FIRE_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { LogMaintenanceDto } from "./dto/log-maintenance.dto";
import { UpdateMaintenanceDto } from "./dto/update-maintenance.dto";
import {
  ListMaintenanceQueryDto,
  parseListMaintenanceQuery,
} from "./dto/list-maintenance-query.dto";

@ApiTags("maintenance")
@Controller("maintenance")
export class MaintenanceGatewayController {
  constructor(
    @Inject(FIRE_SERVICE) private readonly fireClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Log maintenance actions and conditions noted" })
  @ApiBearerAuth()
  @ApiBody({ type: LogMaintenanceDto })
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Post()
  log(@CurrentUser() user: AuthenticatedUser, @Body() dto: LogMaintenanceDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.MAINTENANCE_LOG, {
      performedById: user.sub,
      dto,
    });
  }

  @ApiOperation({ summary: "List maintenance records" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query() query: ListMaintenanceQueryDto) {
    return this.proxy.send(
      this.fireClient,
      FIRE_PATTERNS.MAINTENANCE_LIST,
      parseListMaintenanceQuery(query),
    );
  }

  @ApiOperation({ summary: "View maintenance record" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  view(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.MAINTENANCE_VIEW, { id });
  }

  @ApiOperation({ summary: "Update maintenance record" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiBody({ type: UpdateMaintenanceDto })
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMaintenanceDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.MAINTENANCE_UPDATE, { id, dto });
  }

  @ApiOperation({ summary: "Delete maintenance record" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.MAINTENANCE_REMOVE, { id });
  }
}
