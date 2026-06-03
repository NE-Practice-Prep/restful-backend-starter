/**
 * TCP entry points for extinguisher domain — mirror of HTTP routes on the gateway.
 * Each method delegates to ExtinguishersService and wraps errors with toRpcException.
 */
import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { EXTINGUISHERS_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import type { RpcUserContext } from "@shared/types/rpc-context.type";
import { ExtinguishersService } from "./extinguishers.service";
import type { CreateExtinguisherDto } from "./dto/create-extinguisher.dto";
import type { UpdateExtinguisherDto } from "./dto/update-extinguisher.dto";
import type { parseListExtinguishersQuery } from "./dto/list-extinguishers-query.dto";

type ListExtinguishersParams = ReturnType<typeof parseListExtinguishersQuery>;

@Controller()
export class ExtinguishersMicroserviceController {
  constructor(@Inject(ExtinguishersService) private readonly extinguishers: ExtinguishersService) {}

  @MessagePattern(EXTINGUISHERS_PATTERNS.CREATE)
  async create(@Payload() data: { dto: CreateExtinguisherDto; actor: RpcUserContext }) {
    try {
      return await this.extinguishers.create(data.dto, data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(EXTINGUISHERS_PATTERNS.FIND_ALL)
  async findAll(@Payload() params: ListExtinguishersParams) {
    try {
      return await this.extinguishers.findAll(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(EXTINGUISHERS_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    try {
      return await this.extinguishers.findOne(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(EXTINGUISHERS_PATTERNS.UPDATE)
  async update(
    @Payload() data: { id: string; dto: UpdateExtinguisherDto; actor: RpcUserContext },
  ) {
    try {
      return await this.extinguishers.update(data.id, data.dto, data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(EXTINGUISHERS_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string; actor: RpcUserContext }) {
    try {
      return await this.extinguishers.delete(data.id, data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
