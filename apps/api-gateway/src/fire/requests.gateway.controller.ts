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
import type { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { Role } from "@shared/common/enums/role.enum";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { FIRE_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateExtinguisherRequestDto } from "./dto/create-extinguisher-request.dto";
import { ReviewRequestDto } from "./dto/review-request.dto";

@ApiTags("extinguisher-requests")
@Controller("extinguisher-requests")
export class RequestsGatewayController {
  constructor(
    @Inject(FIRE_SERVICE) private readonly fireClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Submit a new extinguisher request (all authenticated users)" })
  @ApiBearerAuth()
  @ApiBody({ type: CreateExtinguisherRequestDto })
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExtinguisherRequestDto,
  ) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.REQUEST_CREATE, {
      requestedById: user.sub,
      dto,
    });
  }

  @ApiOperation({ summary: "List all requests (admin/inspector) or own requests (user)" })
  @ApiBearerAuth()
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: ["pending", "approved", "rejected", "cancelled"] })
  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    const parsedPage = Math.max(1, Number(page ?? 1) || 1);
    const parsedLimit = Math.min(100, Math.max(1, Number(limit ?? 20) || 20));

    if (user.role === Role.user) {
      return this.proxy.send(this.fireClient, FIRE_PATTERNS.REQUEST_MY_LIST, {
        requestedById: user.sub,
        page: parsedPage,
        limit: parsedLimit,
        status,
      });
    }

    return this.proxy.send(this.fireClient, FIRE_PATTERNS.REQUEST_LIST, {
      page: parsedPage,
      limit: parsedLimit,
      status,
    });
  }

  @ApiOperation({ summary: "View a specific request" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  view(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.REQUEST_VIEW, { id });
  }

  @ApiOperation({ summary: "Approve an extinguisher request (admin only)" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiBody({ type: ReviewRequestDto })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(":id/approve")
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReviewRequestDto,
  ) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.REQUEST_APPROVE, {
      id,
      reviewedById: user.sub,
      dto,
    });
  }

  @ApiOperation({ summary: "Reject an extinguisher request (admin only)" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiBody({ type: ReviewRequestDto })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(":id/reject")
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReviewRequestDto,
  ) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.REQUEST_REJECT, {
      id,
      reviewedById: user.sub,
      dto,
    });
  }

  @ApiOperation({ summary: "Cancel a request (owner or admin)" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @UseGuards(JwtAuthGuard)
  @Patch(":id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.REQUEST_CANCEL, {
      id,
      requestedById: user.sub,
      isAdmin: user.role === Role.admin,
    });
  }
}
