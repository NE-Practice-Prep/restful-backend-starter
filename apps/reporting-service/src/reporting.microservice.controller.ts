import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { REPORTING_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import { ReportingService } from "./reporting.service";

@Controller()
export class ReportingMicroserviceController {
  constructor(@Inject(ReportingService) private readonly reporting: ReportingService) {}

  @MessagePattern(REPORTING_PATTERNS.STOCK_SUMMARY)
  async stockSummary() {
    try {
      return await this.reporting.stockSummary();
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTING_PATTERNS.STOCK_TREND)
  async stockTrend(@Payload() data: { period: "daily" | "monthly" | "yearly" }) {
    try {
      return await this.reporting.stockTrend(data.period ?? "monthly");
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTING_PATTERNS.INSPECTION_STATUS)
  async inspectionStatus() {
    try {
      return await this.reporting.inspectionStatus();
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTING_PATTERNS.EXPIRED_EXTINGUISHERS)
  async expiredExtinguishers() {
    try {
      return await this.reporting.expiredExtinguishers();
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(REPORTING_PATTERNS.MAINTENANCE_HISTORY)
  async maintenanceHistory(
    @Payload()
    data: { page: number; limit: number; extinguisherId?: string; since?: string },
  ) {
    try {
      return await this.reporting.maintenanceHistory({
        page: data.page ?? 1,
        limit: data.limit ?? 20,
        extinguisherId: data.extinguisherId,
        since: data.since,
      });
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
