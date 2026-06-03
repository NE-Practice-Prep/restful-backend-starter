import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictException, NotFoundException } from "@nestjs/common";

import {
  ExtinguisherSize,
  ExtinguisherType,
} from "@shared/generated/prisma/enums";
import { ExtinguishersService } from "./extinguishers.service";
import {
  BASE_DATE,
  EXPIRES_FAR,
  makeExtinguisher,
  makeFirePrisma,
} from "../test/fire-test.fixtures";

describe("ExtinguishersService", () => {
  let service: ExtinguishersService;
  let prisma: ReturnType<typeof makeFirePrisma>;

  const registerDto = {
    serialNumber: "FE-NEW-001",
    location: "Lobby",
    type: ExtinguisherType.water,
    size: ExtinguisherSize.lbs_5,
    installedAt: BASE_DATE,
    expiresAt: EXPIRES_FAR,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makeFirePrisma();
    service = new ExtinguishersService(prisma as never);
  });

  describe("register", () => {
    it("creates an extinguisher with derived compliance status", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(null);
      const created = makeExtinguisher({
        serialNumber: registerDto.serialNumber,
        assetTag: registerDto.serialNumber,
        type: registerDto.type,
        location: registerDto.location,
      });
      prisma.fireExtinguisher.create.mockResolvedValue(created);

      const result = await service.register(registerDto);

      expect(result.serialNumber).toBe("FE-NEW-001");
      expect(result.complianceStatus).toBe("compliant");
      expect(prisma.fireExtinguisher.create).toHaveBeenCalledOnce();
    });

    it("throws ConflictException when serial already exists", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it("throws NotFoundException when siteId is invalid", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(null);
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(
        service.register({ ...registerDto, siteId: "missing-site" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("list", () => {
    it("returns paginated extinguishers", async () => {
      prisma.fireExtinguisher.count.mockResolvedValue(1);
      prisma.fireExtinguisher.findMany.mockResolvedValue([makeExtinguisher()]);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe("view", () => {
    it("throws NotFoundException when missing", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(null);

      await expect(service.view("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("updates location and recalculates compliance", async () => {
      const existing = makeExtinguisher();
      prisma.fireExtinguisher.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);
      prisma.fireExtinguisher.update.mockResolvedValue({
        ...existing,
        location: "New location",
      });

      const result = await service.update("ext-1", { location: "New location" });

      expect(result.location).toBe("New location");
    });
  });

  describe("remove", () => {
    it("deletes after confirming existence", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());
      prisma.fireExtinguisher.delete.mockResolvedValue(makeExtinguisher());

      const result = await service.remove("ext-1");

      expect(result).toEqual({ ok: true });
      expect(prisma.fireExtinguisher.delete).toHaveBeenCalledWith({ where: { id: "ext-1" } });
    });
  });
});
