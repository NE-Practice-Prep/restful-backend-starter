import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { USERS_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import type { ChangePasswordDto } from "@shared/dto/change-password.dto";
import { UsersService } from "./users.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { UpdateMeDto } from "./dto/update-me.dto";
import type { AvatarFilePayload } from "@shared/types/avatar-file.type";
import type { parseListUsersQuery } from "./dto/list-users-query.dto";

type ListUsersParams = ReturnType<typeof parseListUsersQuery>;

@Controller()
export class UsersMicroserviceController {
  constructor(private readonly users: UsersService) {}

  @MessagePattern(USERS_PATTERNS.ME)
  async me(@Payload() data: { userId: string }) {
    try {
      return await this.users.getCurrentUser(data.userId);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.UPDATE_ME)
  async updateMe(@Payload() data: { userId: string; dto: UpdateMeDto }) {
    try {
      return await this.users.updateMe(data.userId, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.CHANGE_PASSWORD)
  async changePassword(@Payload() data: { userId: string; dto: ChangePasswordDto }) {
    try {
      return await this.users.changePassword(data.userId, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.UPLOAD_AVATAR)
  async uploadAvatar(@Payload() data: { userId: string; file: AvatarFilePayload }) {
    try {
      return await this.users.uploadAvatar(data.userId, data.file);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.REMOVE_AVATAR)
  async removeAvatar(@Payload() data: { userId: string }) {
    try {
      return await this.users.removeAvatar(data.userId);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.FIND_ALL)
  async findAll(@Payload() params: ListUsersParams) {
    try {
      return await this.users.findAll(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    try {
      return await this.users.findByIdOrThrow(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.CREATE)
  async create(@Payload() dto: CreateUserDto) {
    try {
      return await this.users.create(dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; dto: UpdateUserDto }) {
    try {
      return await this.users.updateById(data.id, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(USERS_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string }) {
    try {
      return await this.users.deleteById(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
