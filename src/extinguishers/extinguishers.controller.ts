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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtinguishersService } from "./extinguishers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../common/enums/role.enum";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import {
  AssignExtinguisherDto,
  CreateExtinguisherDto,
  ReplaceExtinguisherDto,
  UpdateExtinguisherDto,
} from "./dto/extinguisher.dto";
import {
  ListExtinguishersQueryDto,
  parseListExtinguishersQuery,
} from "./dto/list-extinguishers-query.dto";

@ApiTags("extinguishers")
@Controller("extinguishers")
export class ExtinguishersController {
  constructor(@Inject(ExtinguishersService) private readonly extinguishersService: ExtinguishersService) {}

  @ApiOperation({ summary: "List extinguishers" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get()
  findAll(@Query() query: ListExtinguishersQueryDto) {
    return this.extinguishersService.findAll(parseListExtinguishersQuery(query));
  }

  @ApiOperation({ summary: "Get assigned extinguishers for current customer" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @Get("my")
  myExtinguishers(@CurrentUser() user: AuthenticatedUser) {
    return this.extinguishersService.findForCustomerUser(user.sub);
  }

  @ApiOperation({ summary: "Admin expiry alerts dashboard" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get("alerts")
  alerts() {
    return this.extinguishersService.getAdminAlerts();
  }

  @ApiOperation({ summary: "Get extinguisher by ID" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.extinguishersService.findByIdOrThrow(id);
  }

  @ApiOperation({ summary: "Create extinguisher" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post()
  create(@Body() dto: CreateExtinguisherDto) {
    return this.extinguishersService.create(dto);
  }

  @ApiOperation({ summary: "Update extinguisher" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateExtinguisherDto) {
    return this.extinguishersService.updateById(id, dto);
  }

  @ApiOperation({ summary: "Delete extinguisher" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.extinguishersService.deleteById(id);
  }

  @ApiOperation({ summary: "Assign extinguisher to customer" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post(":id/assign")
  assign(
    @Param("id") id: string,
    @Body() dto: AssignExtinguisherDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.extinguishersService.assign(id, dto, user.sub);
  }

  @ApiOperation({ summary: "Unassign extinguisher from customer" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post(":id/unassign")
  unassign(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.extinguishersService.unassign(id, user.sub);
  }

  @ApiOperation({ summary: "Replace assigned extinguisher with a new unit" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post(":id/replace")
  replace(
    @Param("id") id: string,
    @Body() dto: ReplaceExtinguisherDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.extinguishersService.replace(id, dto, user.sub);
  }
}
