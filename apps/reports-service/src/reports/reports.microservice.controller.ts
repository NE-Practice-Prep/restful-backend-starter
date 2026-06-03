import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { REPORTS_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import type { RpcUserContext } from "@shared/types/rpc-context.type";
import { ReportsService } from "./reports.service";

type ReportsPayload = { actor: RpcUserContext };

@Controller()
export class ReportsMicroserviceController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @MessagePattern(REPORTS_PATTERNS.INVENTORY)
  async inventory(@Payload() data: ReportsPayload) {
    try {
      return await this.reports.inventory(data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTS_PATTERNS.INSPECTIONS)
  async inspections(@Payload() data: ReportsPayload) {
    try {
      return await this.reports.inspections(data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTS_PATTERNS.COMPLIANCE)
  async compliance(@Payload() data: ReportsPayload) {
    try {
      return await this.reports.compliance(data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTS_PATTERNS.MAINTENANCE)
  async maintenance(@Payload() data: ReportsPayload) {
    try {
      return await this.reports.maintenance(data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTS_PATTERNS.OVERVIEW)
  async overview(@Payload() data: ReportsPayload) {
    try {
      return await this.reports.overview(data.actor);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
