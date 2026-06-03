import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

import { MaintenanceType } from "@shared/generated/prisma/enums";
import { MaintenanceService } from "./maintenance.service";
import {
  makeExtinguisher,
  makeFirePrisma,
  makeMaintenance,
} from "../test/fire-test.fixtures";

describe("MaintenanceService", () => {
  let service: MaintenanceService;
  let prisma: ReturnType<typeof makeFirePrisma>;

  const logDto = {
    extinguisherId: "ext-1",
    type: MaintenanceType.repair,
    description: "Replaced discharge hose",
    conditionsNoted: "Bracket showed surface rust",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makeFirePrisma();
    service = new MaintenanceService(prisma as never);
  });

  describe("log", () => {
    it("creates maintenance record and updates extinguisher", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());
      const record = makeMaintenance();
      prisma.maintenanceRecord.create.mockResolvedValue(record);
      prisma.fireExtinguisher.update.mockResolvedValue(makeExtinguisher());

      const result = await service.log("inspector-1", logDto);

      expect(result.description).toBe("Replaced hose");
      expect(result.conditionsNoted).toBe("Minor corrosion on bracket");
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it("throws when extinguisher not found", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(null);

      await expect(service.log("inspector-1", logDto)).rejects.toThrow(NotFoundException);
    });

    it("throws when linked inspection not found", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());
      prisma.inspection.findUnique.mockResolvedValue(null);

      await expect(
        service.log("inspector-1", { ...logDto, inspectionId: "missing-insp" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("list", () => {
    it("returns paginated maintenance records", async () => {
      prisma.maintenanceRecord.count.mockResolvedValue(1);
      prisma.maintenanceRecord.findMany.mockResolvedValue([makeMaintenance()]);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("view", () => {
    it("throws NotFoundException when record missing", async () => {
      prisma.maintenanceRecord.findUnique.mockResolvedValue(null);

      await expect(service.view("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
