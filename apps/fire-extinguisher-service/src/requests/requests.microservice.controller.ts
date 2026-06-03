import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import { RequestsService } from "./requests.service";
import type { CreateRequestDto } from "./dto/create-request.dto";
import type { ReviewRequestDto } from "./dto/review-request.dto";

@Controller()
export class RequestsMicroserviceController {
  constructor(@Inject(RequestsService) private readonly requests: RequestsService) {}

  @MessagePattern(FIRE_PATTERNS.REQUEST_CREATE)
  async createRequest(
    @Payload() data: { requestedById: string; dto: CreateRequestDto },
  ) {
    try {
      return await this.requests.create(data.requestedById, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REQUEST_LIST)
  async listRequests(
    @Payload() params: { page: number; limit: number; status?: string },
  ) {
    try {
      return await this.requests.list(params as Parameters<typeof this.requests.list>[0]);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REQUEST_MY_LIST)
  async myListRequests(
    @Payload() data: { requestedById: string; page: number; limit: number; status?: string },
  ) {
    try {
      return await this.requests.myList(data.requestedById, data as Parameters<typeof this.requests.myList>[1]);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REQUEST_VIEW)
  async viewRequest(@Payload() data: { id: string }) {
    try {
      return await this.requests.view(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REQUEST_APPROVE)
  async approveRequest(
    @Payload() data: { id: string; reviewedById: string; dto: ReviewRequestDto },
  ) {
    try {
      return await this.requests.approve(data.id, data.reviewedById, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REQUEST_REJECT)
  async rejectRequest(
    @Payload() data: { id: string; reviewedById: string; dto: ReviewRequestDto },
  ) {
    try {
      return await this.requests.reject(data.id, data.reviewedById, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REQUEST_CANCEL)
  async cancelRequest(
    @Payload() data: { id: string; requestedById: string; isAdmin: boolean },
  ) {
    try {
      return await this.requests.cancel(data.id, data.requestedById, data.isAdmin);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
