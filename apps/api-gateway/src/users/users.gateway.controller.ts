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
import type { ClientProxy } from "@nestjs/microservices";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { USERS_PATTERNS } from "@shared/microservices/patterns";
import { ChangePasswordDto } from "@shared/dto/change-password.dto";
import { PublicUserDto, CurrentUserResponseDto } from "@shared/common/dto/public-user.dto";
import { OkResponseDto } from "@shared/common/dto/ok-response.dto";
import { Role } from "@shared/common/enums/role.enum";
import type { AuthenticatedUser } from "@shared/types/authenticated-user.type";
import { USERS_SERVICE } from "../clients/microservices.constants";
import { MicroserviceProxyService } from "../clients/microservice-proxy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateMeDto } from "./dto/update-me.dto";
import { ListUsersQueryDto, parseListUsersQuery } from "./dto/list-users-query.dto";

@ApiTags("users")
@Controller("users")
export class UsersGatewayController {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersClient: ClientProxy,
    @Inject(MicroserviceProxyService)
    private readonly proxy: MicroserviceProxyService,
  ) {}

  @ApiOperation({ summary: "Get current user profile" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.ME, { userId: user.sub });
  }

  @ApiOperation({ summary: "Update current user profile" })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateMeDto })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.UPDATE_ME, { userId: user.sub, dto });
  }

  @ApiOperation({ summary: "Change current user password" })
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ type: OkResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post("me/password")
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.CHANGE_PASSWORD, {
      userId: user.sub,
      dto,
    });
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
    return this.proxy.send(this.usersClient, USERS_PATTERNS.UPLOAD_AVATAR, {
      userId: user.sub,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
    });
  }

  @ApiOperation({ summary: "Remove avatar" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete("me/avatar")
  removeAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.REMOVE_AVATAR, { userId: user.sub });
  }

  @ApiOperation({ summary: "List users" })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "Missing or invalid JWT" })
  @ApiForbiddenResponse({ description: "Requires admin role" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.FIND_ALL, parseListUsersQuery(query));
  }

  @ApiOperation({ summary: "Get user by ID" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: PublicUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.FIND_ONE, { id });
  }

  @ApiOperation({ summary: "Create a user" })
  @ApiBearerAuth()
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ type: PublicUserDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.CREATE, dto);
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
    return this.proxy.send(this.usersClient, USERS_PATTERNS.UPDATE, { id, dto });
  }

  @ApiOperation({ summary: "Delete a user" })
  @ApiBearerAuth()
  @ApiParam({ name: "id" })
  @ApiOkResponse({ type: OkResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.proxy.send(this.usersClient, USERS_PATTERNS.DELETE, { id });
  }
}
