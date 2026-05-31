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
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CustomersService } from "./customers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../common/enums/role.enum";
import { CreateCustomerDto, UpdateCustomerDto } from "./dto/create-customer.dto";
import { ListCustomersQueryDto, parseListCustomersQuery } from "./dto/list-customers-query.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";

@ApiTags("customers")
@Controller("customers")
export class CustomersController {
  constructor(@Inject(CustomersService) private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: "List customers (admin)" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get()
  findAll(@Query() query: ListCustomersQueryDto) {
    return this.customersService.findAll(parseListCustomersQuery(query));
  }

  @ApiOperation({ summary: "Get current customer profile" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.getCustomerForUser(user.sub);
  }

  @ApiOperation({ summary: "Get customer by ID (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.customersService.findByIdOrThrow(id);
  }

  @ApiOperation({ summary: "Create customer (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @ApiOperation({ summary: "Update customer (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.updateById(id, dto);
  }

  @ApiOperation({ summary: "Delete customer (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.customersService.deleteById(id);
  }
}
