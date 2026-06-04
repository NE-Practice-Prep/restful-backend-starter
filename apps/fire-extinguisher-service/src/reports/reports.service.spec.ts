import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

import { ReportStatus, ReportType } from "@shared/generated/prisma/enums";
import { ReportsService } from "./reports.service";
import { makeExtinguisher, makeFirePrisma, makeReport } from "../test/fire-test.fixtures";

describe("ReportsService", () => {
  let service: ReportsService;
  let prisma: ReturnType<typeof makeFirePrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makeFirePrisma();
    service = new ReportsService(prisma as never);
  });

  describe("generate", () => {
    it("creates ready inventory report with row count", async () => {
      const pending = makeReport({ status: ReportStatus.generating, rowCount: null });
      const ready = makeReport({ status: ReportStatus.ready, rowCount: 2 });
      prisma.report.create.mockResolvedValue(pending);
      prisma.fireExtinguisher.findMany.mockResolvedValue([
        makeExtinguisher(),
        makeExtinguisher({ id: "ext-2", serialNumber: "FE-002", assetTag: "FE-002" }),
      ]);
      prisma.report.update.mockResolvedValue(ready);

      const result = await service.generate("user-1", {
        type: ReportType.extinguisher_inventory,
      });

      expect(result.status).toBe(ReportStatus.ready);
      expect(result.rowCount).toBe(2);
      expect((result as any).data).toBeDefined();
    });

    it("marks report failed when payload build throws", async () => {
      const pending = makeReport({ status: ReportStatus.generating });
      const failed = makeReport({ status: ReportStatus.failed, errorMessage: "boom" });
      prisma.report.create.mockResolvedValue(pending);
      prisma.fireExtinguisher.findMany.mockRejectedValue(new Error("boom"));
      prisma.report.update.mockResolvedValue(failed);

      const result = await service.generate("user-1", {
        type: ReportType.extinguisher_inventory,
      });

      expect(result.status).toBe(ReportStatus.failed);
    });
  });

  describe("list", () => {
    it("returns reports for user", async () => {
      prisma.report.findMany.mockResolvedValue([makeReport()]);

      const result = await service.list("user-1");

      expect(result.data).toHaveLength(1);
    });
  });

  describe("view", () => {
    it("returns report with snapshot for owner", async () => {
      prisma.report.findUnique.mockResolvedValue(
        makeReport({
          parameters: { snapshot: { rows: [] } },
        }),
      );

      const result = await service.view("report-1", "user-1", false);

      expect(result.id).toBe("report-1");
      expect(result.data).toEqual({ rows: [] });
    });

    it("throws when report not found", async () => {
      prisma.report.findUnique.mockResolvedValue(null);

      await expect(service.view("x", "user-1", false)).rejects.toThrow(NotFoundException);
    });

    it("throws when non-admin views another users report", async () => {
      prisma.report.findUnique.mockResolvedValue(makeReport({ generatedById: "other-user" }));

      await expect(service.view("report-1", "user-1", false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("allows admin to view any report", async () => {
      prisma.report.findUnique.mockResolvedValue(
        makeReport({ generatedById: "other-user", parameters: {} }),
      );

      const result = await service.view("report-1", "admin-1", true);

      expect(result.generatedById).toBe("other-user");
    });
  });
});
