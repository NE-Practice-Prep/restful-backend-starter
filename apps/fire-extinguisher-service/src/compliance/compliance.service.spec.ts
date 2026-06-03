import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

import { Role } from "@shared/common/enums/role.enum";
import { ComplianceStatus } from "@shared/generated/prisma/enums";
import { ComplianceService } from "./compliance.service";
import {
  EXPIRES_FAR,
  makeComplianceRecord,
  makeExtinguisher,
  makeFirePrisma,
} from "../test/fire-test.fixtures";

describe("ComplianceService", () => {
  let service: ComplianceService;
  let prisma: ReturnType<typeof makeFirePrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
    prisma = makeFirePrisma();
    service = new ComplianceService(prisma as never, { sendNotificationEmail: vi.fn() } as never);
  });

  describe("check", () => {
    it("records compliance and updates extinguisher status", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(
        makeExtinguisher({ expiresAt: EXPIRES_FAR }),
      );
      const record = makeComplianceRecord();
      prisma.complianceRecord.create.mockResolvedValue(record);
      prisma.fireExtinguisher.update.mockResolvedValue(makeExtinguisher());

      const result = await service.check("inspector-1", {
        extinguisherId: "ext-1",
        status: ComplianceStatus.compliant,
      });

      expect(result.status).toBe(ComplianceStatus.compliant);
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it("throws when extinguisher not found", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(null);

      await expect(
        service.check("inspector-1", {
          extinguisherId: "missing",
          status: ComplianceStatus.compliant,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("list", () => {
    const adminScope = { requestedByUserId: "admin-1", requestedByRole: Role.admin };

    it("returns compliance history", async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([makeComplianceRecord()]);

      const result = await service.list({ extinguisherId: "ext-1", ...adminScope });

      expect(result.data).toHaveLength(1);
    });

    it("scopes list to assigned extinguishers for regular users", async () => {
      prisma.complianceRecord.findMany.mockResolvedValue([]);

      await service.list({
        requestedByUserId: "user-1",
        requestedByRole: Role.user,
      });

      expect(prisma.complianceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            extinguisher: { assignedToId: "user-1" },
          }),
        }),
      );
    });
  });

  describe("summary", () => {
    it("returns dashboard aggregates", async () => {
      prisma.fireExtinguisher.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(1);
      prisma.fireExtinguisher.groupBy.mockResolvedValue([
        { complianceStatus: ComplianceStatus.compliant, _count: { _all: 4 } },
        { complianceStatus: ComplianceStatus.expiring_soon, _count: { _all: 1 } },
      ]);
      prisma.inspection.count.mockResolvedValue(2);

      const result = await service.summary();

      expect(result.totalExtinguishers).toBe(5);
      expect(result.statusBreakdown.compliant).toBe(4);
      expect(result.expiringSoon).toBe(1);
      expect(result.overdueInspections).toBe(2);
      expect(result.generatedAt).toBeDefined();
    });
  });
});
