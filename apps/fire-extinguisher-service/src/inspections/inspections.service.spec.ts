import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";

import { Role } from "@shared/common/enums/role.enum";
import { InspectionResult } from "@shared/generated/prisma/enums";
import { notifyPersonnel } from "@shared/fire/notifications.helper";
import { InspectionsService } from "./inspections.service";
import {
  FUTURE_DATE,
  makeExtinguisher,
  makeFirePrisma,
  makeInspection,
  makeInspectorUser,
} from "../test/fire-test.fixtures";

vi.mock("@shared/fire/notifications.helper", () => ({
  notifyPersonnel: vi.fn(),
  notifyExtinguisherAssignee: vi.fn(),
  extinguisherLabel: (serial: string, location: string) => `${serial} at ${location}`,
}));

describe("InspectionsService", () => {
  let service: InspectionsService;
  let prisma: ReturnType<typeof makeFirePrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
    prisma = makeFirePrisma();
    service = new InspectionsService(prisma as never, { sendNotificationEmail: vi.fn() } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("schedule", () => {
    it("creates inspection, updates extinguisher, and notifies personnel", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());
      const inspection = makeInspection();
      prisma.inspection.create.mockResolvedValue(inspection);
      prisma.fireExtinguisher.update.mockResolvedValue(makeExtinguisher());

      const result = await service.schedule(
        { extinguisherId: "ext-1", scheduledAt: FUTURE_DATE },
        "user-1",
      );

      expect(result.status).toBe("scheduled");
      expect(prisma.inspection.create).toHaveBeenCalledOnce();
      expect(prisma.fireExtinguisher.update).toHaveBeenCalledOnce();
      expect(notifyPersonnel).toHaveBeenCalledOnce();
    });

    it("throws when extinguisher not found", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(null);

      await expect(
        service.schedule({ extinguisherId: "x", scheduledAt: FUTURE_DATE }, "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws when scheduled time is not in the future", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());

      await expect(
        service.schedule(
          { extinguisherId: "ext-1", scheduledAt: new Date("2026-06-01T11:00:00Z") },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws when inspectorId is not inspector or admin", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());
      prisma.user.findUnique.mockResolvedValue({ id: "u1", role: "user" });

      await expect(
        service.schedule(
          {
            extinguisherId: "ext-1",
            scheduledAt: FUTURE_DATE,
            inspectorId: "u1",
          },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("accepts a valid inspector assignment", async () => {
      prisma.fireExtinguisher.findUnique.mockResolvedValue(makeExtinguisher());
      prisma.user.findUnique.mockResolvedValue(makeInspectorUser());
      prisma.inspection.create.mockResolvedValue(makeInspection({ inspectorId: "inspector-1" }));
      prisma.fireExtinguisher.update.mockResolvedValue(makeExtinguisher());

      await service.schedule(
        {
          extinguisherId: "ext-1",
          scheduledAt: FUTURE_DATE,
          inspectorId: "inspector-1",
        },
        "user-1",
      );

      expect(prisma.inspection.create).toHaveBeenCalled();
    });
  });

  describe("complete", () => {
    it("marks inspection completed and sets needs_maintenance on fail", async () => {
      const inspection = {
        ...makeInspection(),
        extinguisher: makeExtinguisher(),
        startedAt: null,
      };
      prisma.inspection.findUnique.mockResolvedValue(inspection);
      const completed = makeInspection({
        status: "completed",
        result: InspectionResult.fail,
      });
      prisma.inspection.update.mockResolvedValue(completed);
      prisma.fireExtinguisher.update.mockResolvedValue(makeExtinguisher());

      const result = await service.complete("insp-1", "inspector-1", {
        result: InspectionResult.fail,
        findings: "Gauge unreadable",
      });

      expect(result.status).toBe("completed");
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });
  });

  describe("list", () => {
    const adminScope = { requestedByUserId: "admin-1", requestedByRole: Role.admin };

    it("returns paginated inspections", async () => {
      prisma.inspection.count.mockResolvedValue(2);
      prisma.inspection.findMany.mockResolvedValue([
        makeInspection(),
        makeInspection({ id: "insp-2" }),
      ]);

      const result = await service.list({
        page: 1,
        limit: 10,
        extinguisherId: undefined,
        status: undefined,
        ...adminScope,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it("scopes list to assigned extinguishers for regular users", async () => {
      prisma.inspection.count.mockResolvedValue(0);
      prisma.inspection.findMany.mockResolvedValue([]);

      await service.list({
        page: 1,
        limit: 10,
        extinguisherId: undefined,
        status: undefined,
        requestedByUserId: "user-1",
        requestedByRole: Role.user,
      });

      expect(prisma.inspection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            extinguisher: { assignedToId: "user-1" },
          }),
        }),
      );
    });
  });

  describe("view", () => {
    it("returns inspection for admin without assignment filter", async () => {
      prisma.inspection.findFirst.mockResolvedValue(makeInspection());

      const result = await service.view("insp-1", {
        requestedByUserId: "admin-1",
        requestedByRole: Role.admin,
      });

      expect(result.id).toBe("insp-1");
      expect(prisma.inspection.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "insp-1" } }),
      );
    });

    it("hides inspections for unassigned extinguishers from regular users", async () => {
      prisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.view("insp-1", {
          requestedByUserId: "user-1",
          requestedByRole: Role.user,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
