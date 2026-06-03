import {
  Body,
  Controller,
  Delete,
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
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
import { CheckComplianceDto } from "./dto/check-compliance.dto";

@ApiTags("compliance")
@Controller("compliance")
export class ComplianceGatewayController {
  constructor(
    @Inject(FIRE_SERVICE) private readonly fireClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Record compliance check for an extinguisher" })
  @ApiBearerAuth()
  @ApiBody({ type: CheckComplianceDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.inspector)
  @Post("check")
  check(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckComplianceDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.COMPLIANCE_CHECK, {
      checkedById: user.sub,
      dto,
    });
  }

  @ApiOperation({ summary: "Real-time compliance dashboard summary" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("summary")
  summary() {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.COMPLIANCE_SUMMARY, {});
  }

  @ApiOperation({
    summary:
      "List compliance audit records — admins/inspectors see all, users see only their assigned extinguishers",
  })
  @ApiBearerAuth()
  @ApiQuery({ name: "extinguisherId", required: false })
  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("extinguisherId") extinguisherId?: string,
  ) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.COMPLIANCE_LIST, {
      extinguisherId,
      requestedByUserId: user.sub,
      requestedByRole: user.role,
    });
  }

  @ApiOperation({ summary: "View compliance record details" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  view(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.COMPLIANCE_VIEW, {
      id,
      requestedByUserId: user.sub,
      requestedByRole: user.role,
    });
  }

  @ApiOperation({ summary: "Delete compliance record" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.COMPLIANCE_REMOVE, { id });
  }
}
