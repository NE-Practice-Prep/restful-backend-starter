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
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { EXTINGUISHERS_PATTERNS } from "@shared/microservices/patterns";
import { ROLE_POLICY } from "@shared/auth/role-policy";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { EXTINGUISHERS_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateExtinguisherDto } from "./dto/create-extinguisher.dto";
import { UpdateExtinguisherDto } from "./dto/update-extinguisher.dto";
import {
  ListExtinguishersQueryDto,
  parseListExtinguishersQuery,
} from "./dto/list-extinguishers-query.dto";

@ApiTags("extinguishers")
@Controller("extinguishers")
export class ExtinguishersGatewayController {
  constructor(
    @Inject(EXTINGUISHERS_SERVICE) private readonly extinguishersClient: ClientProxy,
    @Inject(MicroserviceProxyService)
    private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "List fire extinguishers" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.AUTHENTICATED)
  @Get()
  findAll(@Query() query: ListExtinguishersQueryDto) {
    return this.proxy.send(
      this.extinguishersClient,
      EXTINGUISHERS_PATTERNS.FIND_ALL,
      parseListExtinguishersQuery(query),
    );
  }

  @ApiOperation({ summary: "Get fire extinguisher by ID" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.AUTHENTICATED)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.proxy.send(this.extinguishersClient, EXTINGUISHERS_PATTERNS.FIND_ONE, { id });
  }

  @ApiOperation({ summary: "Register a fire extinguisher" })
  @ApiBearerAuth()
  @ApiBody({ type: CreateExtinguisherDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.INSPECTOR_UP)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExtinguisherDto) {
    return this.proxy.send(this.extinguishersClient, EXTINGUISHERS_PATTERNS.CREATE, {
      dto,
      actor: { userId: user.sub, role: user.role },
    });
  }

  @ApiOperation({ summary: "Update a fire extinguisher" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiBody({ type: UpdateExtinguisherDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires inspector or admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.INSPECTOR_UP)
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateExtinguisherDto,
  ) {
    return this.proxy.send(this.extinguishersClient, EXTINGUISHERS_PATTERNS.UPDATE, {
      id,
      dto,
      actor: { userId: user.sub, role: user.role },
    });
  }

  @ApiOperation({ summary: "Delete a fire extinguisher" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLE_POLICY.ADMIN_ONLY)
  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.proxy.send(this.extinguishersClient, EXTINGUISHERS_PATTERNS.DELETE, {
      id,
      actor: { userId: user.sub, role: user.role },
    });
  }
}
