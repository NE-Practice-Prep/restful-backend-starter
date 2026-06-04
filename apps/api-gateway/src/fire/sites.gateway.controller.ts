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

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { OkResponseDto } from "@shared/common/dto/ok-response.dto";
import { Role } from "@shared/common/enums/role.enum";
import { FIRE_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateSiteDto } from "./dto/create-site.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import { ListSitesQueryDto, parseListSitesQuery } from "./dto/list-sites-query.dto";

/**
 * Physical site/location HTTP routes for extinguisher placement.
 * Proxies to fire-extinguisher-service; writes require admin role.
 */
@ApiTags("sites")
@Controller("sites")
export class SitesGatewayController {
  constructor(
    @Inject(FIRE_SERVICE) private readonly fireClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Create a site" })
  @ApiBearerAuth()
  @ApiBody({ type: CreateSiteDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post()
  create(@Body() dto: CreateSiteDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.SITE_CREATE, dto);
  }

  @ApiOperation({ summary: "List sites" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query() query: ListSitesQueryDto) {
    return this.proxy.send(
      this.fireClient,
      FIRE_PATTERNS.SITE_LIST,
      parseListSitesQuery(query),
    );
  }

  @ApiOperation({ summary: "View site details" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  view(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.SITE_VIEW, { id });
  }

  @ApiOperation({ summary: "Update site" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiBody({ type: UpdateSiteDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSiteDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.SITE_UPDATE, { id, dto });
  }

  @ApiOperation({ summary: "Remove site" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: OkResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.SITE_REMOVE, { id });
  }
}
