import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenException } from "@nestjs/common";

import { ReportsService } from "./reports.service";
import { Role } from "@shared/common/enums/role.enum";

function makePrisma() {
  return {
    fireExtinguisher: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    inspection: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    maintenanceLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

describe("ReportsService", () => {
  let service: ReportsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new ReportsService(prisma as never);
  });

  describe("inventory", () => {
    it("returns summary for viewers", async () => {
      prisma.fireExtinguisher.count.mockResolvedValue(5);
      prisma.fireExtinguisher.groupBy.mockResolvedValue([
        { status: "active", _count: { _all: 4 } },
        { status: "expired", _count: { _all: 1 } },
      ]);

      const result = await service.inventory({ userId: "u1", role: Role.viewer });

      expect(result.scope).toBe("summary");
      expect(result.total).toBe(5);
      expect(prisma.fireExtinguisher.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ["status"] }),
      );
    });

    it("returns full report for editors", async () => {
      prisma.fireExtinguisher.count.mockResolvedValue(10);
      prisma.fireExtinguisher.groupBy
        .mockResolvedValueOnce([{ status: "active", _count: { _all: 10 } }])
        .mockResolvedValueOnce([{ type: "CO2", _count: { _all: 10 } }]);

      const result = await service.inventory({ userId: "u1", role: Role.editor });

      expect(result.scope).toBe("full");
      expect(result).toHaveProperty("summaries");
      expect(result).toHaveProperty("byType");
    });
  });

  describe("maintenance", () => {
    it("throws ForbiddenException for viewers", async () => {
      await expect(
        service.maintenance({ userId: "u1", role: Role.viewer }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
