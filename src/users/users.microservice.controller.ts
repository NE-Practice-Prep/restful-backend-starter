import { Controller } from "@nestjs/common";
import { MessagePattern, Payload, RpcException } from "@nestjs/microservices";

import { UsersService } from "./users.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { UpdateMeDto } from "./dto/update-me.dto";
import type { parseListUsersQuery } from "./dto/list-users-query.dto";
import type { ChangePasswordDto } from "../auth/dto/change-password.dto";

type ListUsersParams = ReturnType<typeof parseListUsersQuery>;

@Controller()
export class UsersMicroserviceController {
  constructor(private readonly users: UsersService) {}

  @MessagePattern("users.me")
  async me(@Payload() data: { userId: string }) {
    try {
      return await this.users.getCurrentUser(data.userId);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Not found");
    }
  }

  @MessagePattern("users.update_me")
  async updateMe(@Payload() data: { userId: string; dto: UpdateMeDto }) {
    try {
      return await this.users.updateMe(data.userId, data.dto);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Update failed");
    }
  }

  @MessagePattern("users.change_password")
  async changePassword(@Payload() data: { userId: string; dto: ChangePasswordDto }) {
    try {
      return await this.users.changePassword(data.userId, data.dto);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Change password failed");
    }
  }

  @MessagePattern("users.find_all")
  async findAll(@Payload() params: ListUsersParams) {
    try {
      return await this.users.findAll(params);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Query failed");
    }
  }

  @MessagePattern("users.find_one")
  async findOne(@Payload() data: { id: string }) {
    try {
      return await this.users.findByIdOrThrow(data.id);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Not found");
    }
  }

  @MessagePattern("users.create")
  async create(@Payload() dto: CreateUserDto) {
    try {
      return await this.users.create(dto);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Create failed");
    }
  }

  @MessagePattern("users.update")
  async update(@Payload() data: { id: string; dto: UpdateUserDto }) {
    try {
      return await this.users.updateById(data.id, data.dto);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Update failed");
    }
  }

  @MessagePattern("users.delete")
  async delete(@Payload() data: { id: string }) {
    try {
      return await this.users.deleteById(data.id);
    } catch (e: unknown) {
      throw new RpcException((e as Error).message ?? "Delete failed");
    }
  }
}
