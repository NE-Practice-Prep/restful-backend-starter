import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { UpdateMeDto } from "./dto/update-me.dto";
import { ChangePasswordDto } from "../auth/dto/change-password.dto";
import { PublicUserDto, CurrentUserResponseDto } from "../common/dto/public-user.dto";
import { ListUsersQueryDto, parseListUsersQuery } from "./dto/list-users-query.dto";
import { OkResponseDto } from "../common/dto/ok-response.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Get current user profile" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getCurrentUser(user.sub);
  }

  @ApiOperation({ summary: "Update current user profile" })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateMeDto })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @ApiOperation({ summary: "Change current user password" })
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ type: OkResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post("me/password")
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, dto);
  }

  @ApiOperation({ summary: "Upload avatar" })
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @UseGuards(JwtAuthGuard)
  @Post("me/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("File is required");
    return this.usersService.uploadAvatar(user.sub, file);
  }

  @ApiOperation({ summary: "Remove avatar" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete("me/avatar")
  removeAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.removeAvatar(user.sub);
  }

  @ApiOperation({ summary: "List users" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(parseListUsersQuery(query));
  }

  @ApiOperation({ summary: "Get user by ID" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: PublicUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findByIdOrThrow(id);
  }

  @ApiOperation({ summary: "Create a user" })
  @ApiBearerAuth()
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ type: PublicUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: "Update a user" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: PublicUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateById(id, dto);
  }

  @ApiOperation({ summary: "Delete a user" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: OkResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.usersService.deleteById(id);
  }
}
