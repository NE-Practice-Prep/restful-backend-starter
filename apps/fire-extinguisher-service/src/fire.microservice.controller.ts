import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { toRpcException } from "@shared/utils/rpc.util";
import { ExtinguishersService } from "./extinguishers/extinguishers.service";
import { InspectionsService } from "./inspections/inspections.service";
import { MaintenanceService } from "./maintenance/maintenance.service";
import { ComplianceService } from "./compliance/compliance.service";
import { ReportsService } from "./reports/reports.service";
import type { RegisterExtinguisherDto } from "./extinguishers/dto/register-extinguisher.dto";
import type { UpdateExtinguisherDto } from "./extinguishers/dto/update-extinguisher.dto";
import type { parseListExtinguishersQuery } from "./extinguishers/dto/list-extinguishers-query.dto";
import type { ScheduleInspectionDto } from "./inspections/dto/schedule-inspection.dto";
import type {
  CompleteInspectionDto,
  UpdateInspectionDto,
} from "./inspections/dto/complete-inspection.dto";
import type { parseListInspectionsQuery } from "./inspections/dto/list-inspections-query.dto";
import type { LogMaintenanceDto } from "./maintenance/dto/log-maintenance.dto";
import type { UpdateMaintenanceDto } from "./maintenance/dto/update-maintenance.dto";
import type { parseListMaintenanceQuery } from "./maintenance/dto/list-maintenance-query.dto";
import type { CheckComplianceDto } from "./compliance/dto/check-compliance.dto";
import type { GenerateReportDto } from "./reports/dto/generate-report.dto";

@Controller()
export class FireMicroserviceController {
  constructor(
    @Inject(ExtinguishersService) private readonly extinguishers: ExtinguishersService,
    @Inject(InspectionsService) private readonly inspections: InspectionsService,
    @Inject(MaintenanceService) private readonly maintenance: MaintenanceService,
    @Inject(ComplianceService) private readonly compliance: ComplianceService,
    @Inject(ReportsService) private readonly reports: ReportsService,
  ) {}

  @MessagePattern(FIRE_PATTERNS.EXTINGUISHER_REGISTER)
  async registerExtinguisher(@Payload() dto: RegisterExtinguisherDto) {
    try {
      return await this.extinguishers.register(dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.EXTINGUISHER_LIST)
  async listExtinguishers(
    @Payload() params: ReturnType<typeof parseListExtinguishersQuery> & { requestedByUserId: string; requestedByRole: string },
  ) {
    try {
      return await this.extinguishers.list(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.EXTINGUISHER_VIEW)
  async viewExtinguisher(@Payload() data: { id: string }) {
    try {
      return await this.extinguishers.view(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.EXTINGUISHER_UPDATE)
  async updateExtinguisher(@Payload() data: { id: string; dto: UpdateExtinguisherDto }) {
    try {
      return await this.extinguishers.update(data.id, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.EXTINGUISHER_REMOVE)
  async removeExtinguisher(@Payload() data: { id: string }) {
    try {
      return await this.extinguishers.remove(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.EXTINGUISHER_ASSIGN)
  async assignExtinguisher(@Payload() data: { id: string; userId: string }) {
    try {
      return await this.extinguishers.assign(data.id, data.userId);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.EXTINGUISHER_UNASSIGN)
  async unassignExtinguisher(@Payload() data: { id: string }) {
    try {
      return await this.extinguishers.unassign(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.INSPECTION_SCHEDULE)
  async scheduleInspection(
    @Payload() data: { dto: ScheduleInspectionDto; requestedById: string },
  ) {
    try {
      return await this.inspections.schedule(data.dto, data.requestedById);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.INSPECTION_LIST)
  async listInspections(
    @Payload() params: ReturnType<typeof parseListInspectionsQuery> & {
      requestedByUserId: string;
      requestedByRole: string;
    },
  ) {
    try {
      return await this.inspections.list(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.INSPECTION_VIEW)
  async viewInspection(
    @Payload() data: { id: string; requestedByUserId: string; requestedByRole: string },
  ) {
    try {
      return await this.inspections.view(data.id, {
        requestedByUserId: data.requestedByUserId,
        requestedByRole: data.requestedByRole,
      });
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.INSPECTION_COMPLETE)
  async completeInspection(
    @Payload() data: { id: string; inspectorId: string; dto: CompleteInspectionDto },
  ) {
    try {
      return await this.inspections.complete(data.id, data.inspectorId, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.INSPECTION_UPDATE)
  async updateInspection(@Payload() data: { id: string; dto: UpdateInspectionDto }) {
    try {
      return await this.inspections.update(data.id, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.INSPECTION_REMOVE)
  async removeInspection(@Payload() data: { id: string }) {
    try {
      return await this.inspections.remove(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.MAINTENANCE_LOG)
  async logMaintenance(@Payload() data: { performedById: string; dto: LogMaintenanceDto }) {
    try {
      return await this.maintenance.log(data.performedById, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.MAINTENANCE_LIST)
  async listMaintenance(@Payload() params: ReturnType<typeof parseListMaintenanceQuery>) {
    try {
      return await this.maintenance.list(params);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.MAINTENANCE_VIEW)
  async viewMaintenance(@Payload() data: { id: string }) {
    try {
      return await this.maintenance.view(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.MAINTENANCE_UPDATE)
  async updateMaintenance(@Payload() data: { id: string; dto: UpdateMaintenanceDto }) {
    try {
      return await this.maintenance.update(data.id, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.MAINTENANCE_REMOVE)
  async removeMaintenance(@Payload() data: { id: string }) {
    try {
      return await this.maintenance.remove(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.COMPLIANCE_CHECK)
  async checkCompliance(@Payload() data: { checkedById: string; dto: CheckComplianceDto }) {
    try {
      return await this.compliance.check(data.checkedById, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.COMPLIANCE_LIST)
  async listCompliance(
    @Payload() data: {
      extinguisherId?: string;
      requestedByUserId: string;
      requestedByRole: string;
    },
  ) {
    try {
      return await this.compliance.list(data);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.COMPLIANCE_VIEW)
  async viewCompliance(
    @Payload() data: { id: string; requestedByUserId: string; requestedByRole: string },
  ) {
    try {
      return await this.compliance.view(data.id, {
        requestedByUserId: data.requestedByUserId,
        requestedByRole: data.requestedByRole,
      });
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.COMPLIANCE_REMOVE)
  async removeCompliance(@Payload() data: { id: string }) {
    try {
      return await this.compliance.remove(data.id);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.COMPLIANCE_SUMMARY)
  async complianceSummary() {
    try {
      return await this.compliance.summary();
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REPORT_GENERATE)
  async generateReport(@Payload() data: { generatedById: string; dto: GenerateReportDto }) {
    try {
      return await this.reports.generate(data.generatedById, data.dto);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REPORT_LIST)
  async listReports(@Payload() data: { generatedById: string }) {
    try {
      return await this.reports.list(data.generatedById);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REPORT_VIEW)
  async viewReport(
    @Payload() data: { id: string; userId: string; isAdmin: boolean },
  ) {
    try {
      return await this.reports.view(data.id, data.userId, data.isAdmin);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }

  @MessagePattern(FIRE_PATTERNS.REPORT_REMOVE)
  async removeReport(
    @Payload() data: { id: string; userId: string; isAdmin: boolean },
  ) {
    try {
      return await this.reports.remove(data.id, data.userId, data.isAdmin);
    } catch (e: unknown) {
      throw toRpcException(e);
    }
  }
}
