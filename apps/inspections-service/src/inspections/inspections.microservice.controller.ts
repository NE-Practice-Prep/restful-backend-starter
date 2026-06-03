import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { INSPECTIONS_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import type { RpcUserContext } from "@shared/types/rpc-context.type";
import { InspectionsService } from "./inspections.service";
import type { ScheduleInspectionDto } from "./dto/schedule-inspection.dto";
import type { CompleteInspectionDto } from "./dto/complete-inspection.dto";
import type { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
import type {
  parseListInspectionsQuery,
  parseListMaintenanceQuery,
} from "./dto/list-inspections-query.dto";

type ListInspectionsParams = ReturnType<typeof parseListInspectionsQuery>;
type ListMaintenanceParams = ReturnType<typeof parseListMaintenanceQuery>;

@Controller()
export class InspectionsMicroserviceController {
  constructor(@Inject(InspectionsService) private readonly inspections: InspectionsService) {}

  @MessagePattern(INSPECTIONS_PATTERNS.SCHEDULE)
  async schedule(@Payload() data: { dto: ScheduleInspectionDto; actor: RpcUserContext }) {
    try {
      return await this.inspections.schedule(data.dto, data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(INSPECTIONS_PATTERNS.FIND_ALL)
  async findAll(@Payload() params: ListInspectionsParams) {
    try {
      return await this.inspections.findAll(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(INSPECTIONS_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    try {
      return await this.inspections.findOne(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(INSPECTIONS_PATTERNS.COMPLETE)
  async complete(
    @Payload() data: { id: string; dto: CompleteInspectionDto; actor: RpcUserContext },
  ) {
    try {
      return await this.inspections.complete(data.id, data.dto, data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(INSPECTIONS_PATTERNS.CANCEL)
  async cancel(@Payload() data: { id: string; actor: RpcUserContext }) {
    try {
      return await this.inspections.cancel(data.id, data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(INSPECTIONS_PATTERNS.CREATE_MAINTENANCE)
  async createMaintenance(
    @Payload() data: { dto: CreateMaintenanceDto; actor: RpcUserContext },
  ) {
    try {
      return await this.inspections.createMaintenance(data.dto, data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(INSPECTIONS_PATTERNS.FIND_MAINTENANCE)
  async findMaintenance(@Payload() params: ListMaintenanceParams) {
    try {
      return await this.inspections.findMaintenance(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
