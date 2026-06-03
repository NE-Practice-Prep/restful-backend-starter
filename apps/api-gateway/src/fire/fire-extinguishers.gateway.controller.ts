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
import { RegisterExtinguisherDto } from "./dto/register-extinguisher.dto";
import { UpdateExtinguisherDto } from "./dto/update-extinguisher.dto";
import {
  ListExtinguishersQueryDto,
  parseListExtinguishersQuery,
} from "./dto/list-extinguishers-query.dto";

@ApiTags("fire-extinguishers")
@Controller("fire-extinguishers")
export class FireExtinguishersGatewayController {
  constructor(
    @Inject(FIRE_SERVICE) private readonly fireClient: ClientProxy,
    @Inject(MicroserviceProxyService) private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Register a fire extinguisher" })
  @ApiBearerAuth()
  @ApiBody({ type: RegisterExtinguisherDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post()
  register(@Body() dto: RegisterExtinguisherDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.EXTINGUISHER_REGISTER, dto);
  }

  @ApiOperation({ summary: "List fire extinguishers and status" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query() query: ListExtinguishersQueryDto) {
    return this.proxy.send(
      this.fireClient,
      FIRE_PATTERNS.EXTINGUISHER_LIST,
      parseListExtinguishersQuery(query),
    );
  }

  @ApiOperation({ summary: "View fire extinguisher details" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  view(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.EXTINGUISHER_VIEW, { id });
  }

  @ApiOperation({ summary: "Update fire extinguisher" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiBody({ type: UpdateExtinguisherDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateExtinguisherDto) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.EXTINGUISHER_UPDATE, { id, dto });
  }

  @ApiOperation({ summary: "Remove fire extinguisher" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: OkResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.proxy.send(this.fireClient, FIRE_PATTERNS.EXTINGUISHER_REMOVE, { id });
  }
}
