import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

import { FIRE_PATTERNS } from "@shared/microservices/patterns";
import { FireMicroserviceController } from "./fire.microservice.controller";
import {
  ExtinguisherSize,
  ExtinguisherType,
  InspectionResult,
  MaintenanceType,
  ReportType,
} from "@shared/generated/prisma/enums";
import { BASE_DATE, EXPIRES_FAR, FUTURE_DATE } from "./test/fire-test.fixtures";

function makeServices() {
  return {
    extinguishers: {
      register: vi.fn(),
      list: vi.fn(),
      view: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    inspections: {
      schedule: vi.fn(),
      list: vi.fn(),
      view: vi.fn(),
      complete: vi.fn(),
      update: vi.fn(),
    },
    maintenance: {
      log: vi.fn(),
      list: vi.fn(),
      view: vi.fn(),
    },
    compliance: {
      check: vi.fn(),
      list: vi.fn(),
      summary: vi.fn(),
    },
    reports: {
      generate: vi.fn(),
      list: vi.fn(),
      view: vi.fn(),
    },
  };
}

describe("FireMicroserviceController", () => {
  let controller: FireMicroserviceController;
  let services: ReturnType<typeof makeServices>;

  beforeEach(() => {
    vi.clearAllMocks();
    services = makeServices();
    controller = new FireMicroserviceController(
      services.extinguishers as never,
      services.inspections as never,
      services.maintenance as never,
      services.compliance as never,
      services.reports as never,
    );
  });

  it("maps HttpException to RpcException on register", async () => {
    services.extinguishers.register.mockRejectedValue(
      new NotFoundException("Fire extinguisher not found"),
    );

    await expect(
      controller.registerExtinguisher({
        serialNumber: "X",
        location: "L",
        type: ExtinguisherType.water,
        size: ExtinguisherSize.lbs_5,
        installedAt: BASE_DATE,
        expiresAt: EXPIRES_FAR,
      }),
    ).rejects.toBeInstanceOf(RpcException);
  });

  it("delegates inspection schedule to service", async () => {
    services.inspections.schedule.mockResolvedValue({ id: "insp-1" });

    const result = await controller.scheduleInspection({
      dto: { extinguisherId: "ext-1", scheduledAt: FUTURE_DATE },
      requestedById: "user-1",
    });

    expect(result).toEqual({ id: "insp-1" });
    expect(services.inspections.schedule).toHaveBeenCalledOnce();
  });

  it("delegates maintenance log to service", async () => {
    services.maintenance.log.mockResolvedValue({ id: "maint-1" });

    await controller.logMaintenance({
      performedById: "inspector-1",
      dto: {
        extinguisherId: "ext-1",
        type: MaintenanceType.repair,
        description: "Fixed",
        conditionsNoted: "OK",
      },
    });

    expect(services.maintenance.log).toHaveBeenCalledOnce();
  });

  it("delegates report generate to service", async () => {
    services.reports.generate.mockResolvedValue({ id: "report-1", status: "ready" });

    await controller.generateReport({
      generatedById: "user-1",
      dto: { type: ReportType.compliance_overview },
    });

    expect(services.reports.generate).toHaveBeenCalledOnce();
  });

  it("exposes all FIRE_PATTERNS handlers", () => {
    const handlerNames = [
      "registerExtinguisher",
      "listExtinguishers",
      "viewExtinguisher",
      "updateExtinguisher",
      "removeExtinguisher",
      "scheduleInspection",
      "listInspections",
      "viewInspection",
      "completeInspection",
      "updateInspection",
      "logMaintenance",
      "listMaintenance",
      "viewMaintenance",
      "checkCompliance",
      "listCompliance",
      "complianceSummary",
      "generateReport",
      "listReports",
      "viewReport",
    ] as const satisfies readonly (keyof FireMicroserviceController)[];

    for (const name of handlerNames) {
      expect(typeof controller[name]).toBe("function");
    }

    expect(Object.keys(FIRE_PATTERNS)).toHaveLength(19);
  });
});
