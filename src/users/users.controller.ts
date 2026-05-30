import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../common/enums/role.enum";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { UpdateMeDto } from "./dto/update-me.dto";
import { PublicUserDto } from "../common/dto/public-user.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: "Get current user profile",
    description: "Returns the authenticated user's full profile from the database.",
  })
  @ApiBearerAuth()
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findByIdOrThrow(user.sub);
  }

  @ApiOperation({
    summary: "Update current user profile",
    description: "Updates profile fields for the authenticated user. Only name can be changed here.",
  })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateMeDto })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @ApiOperation({
    summary: "List users",
    description: "Returns up to 20 users ordered by most recently created. Requires ADMIN role.",
  })
  @ApiBearerAuth()
  @ApiOkResponse({ type: PublicUserDto, isArray: true })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires ADMIN role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: "Get user by ID",
    description: "Returns a single user by ID. Requires ADMIN or MODERATOR role.",
  })
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "User ID", example: "clxyz123abc456def789" })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires ADMIN or MODERATOR role" })
  @ApiNotFoundResponse({ description: "User not found" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findByIdOrThrow(id);
  }

  @ApiOperation({
    summary: "Create a user",
    description:
      "Creates a new user account. Requires ADMIN role. Defaults to USER role and active status when omitted.",
  })
  @ApiBearerAuth()
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires ADMIN role" })
  @ApiBadRequestResponse({ description: "Email already registered" })
  @ApiBody({ type: CreateUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({
    summary: "Update a user",
    description: "Partially updates a user by ID. Requires ADMIN role.",
  })
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "User ID", example: "clxyz123abc456def789" })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires ADMIN role" })
  @ApiNotFoundResponse({ description: "User not found" })
  @ApiBody({ type: UpdateUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateById(id, dto);
  }

  @ApiOperation({
    summary: "Replace user roles",
    description: "Replaces the full role list for a user. Requires ADMIN role.",
  })
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "User ID", example: "clxyz123abc456def789" })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires ADMIN role" })
  @ApiNotFoundResponse({ description: "User not found" })
  @ApiBody({ type: UpdateUserRolesDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(":id/roles")
  setRoles(@Param("id") id: string, @Body() dto: UpdateUserRolesDto) {
    return this.usersService.setRoles(id, dto.roles);
  }

  @ApiOperation({
    summary: "Deactivate a user",
    description: "Soft-deletes a user by setting isActive to false. Requires ADMIN role.",
  })
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "User ID", example: "clxyz123abc456def789" })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires ADMIN role" })
  @ApiNotFoundResponse({ description: "User not found" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(":id")
  deactivate(@Param("id") id: string) {
    return this.usersService.deactivate(id);
  }
}
