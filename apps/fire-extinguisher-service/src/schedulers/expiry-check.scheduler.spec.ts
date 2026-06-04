import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Role } from "@shared/common/enums/role.enum";

import { ComplianceStatus } from "@shared/generated/prisma/enums";
import { notifyPersonnel } from "@shared/fire/notifications.helper";
import { ExpiryCheckScheduler } from "./expiry-check.scheduler";

vi.mock("@shared/fire/notifications.helper", () => ({
  notifyPersonnel: vi.fn(),
  notifyExtinguisherAssignee: vi.fn(),
  extinguisherLabel: (serial: string, location: string) => `${serial} at ${location}`,
}));

describe("ExpiryCheckScheduler", () => {
  let scheduler: ExpiryCheckScheduler;
  let prisma: {
    fireExtinguisher: {
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T08:00:00Z"));

    prisma = {
      fireExtinguisher: {
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    scheduler = new ExpiryCheckScheduler(prisma as never, {
      sendNotificationEmail: vi.fn(),
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("notifies operations and assignees when extinguishers are expired or expiring", async () => {
    const expired = {
      id: "ext-expired",
      serialNumber: "FE-001",
      location: "Lobby",
      expiresAt: new Date("2026-05-01"),
      assignedToId: "user-1",
      complianceStatus: ComplianceStatus.non_compliant,
    };
    const expiringSoon = {
      id: "ext-soon",
      serialNumber: "FE-002",
      location: "Hall",
      expiresAt: new Date("2026-06-15"),
      assignedToId: "user-2",
      complianceStatus: ComplianceStatus.expiring_soon,
    };

    prisma.fireExtinguisher.findMany
      .mockResolvedValueOnce([expired])
      .mockResolvedValueOnce([expiringSoon])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: expired.id, expiresAt: expired.expiresAt, complianceStatus: expired.complianceStatus },
        { id: expiringSoon.id, expiresAt: expiringSoon.expiresAt, complianceStatus: expiringSoon.complianceStatus },
      ]);

    await scheduler.runExpiryCheck();

    const notify = vi.mocked(notifyPersonnel);

    expect(notify).toHaveBeenCalled();
    expect(
      notify.mock.calls.some(([, params]) => params.roles?.includes(Role.admin)),
    ).toBe(true);
    expect(
      notify.mock.calls.some(
        ([, params]) =>
          params.userIds?.includes("user-1") || params.userIds?.includes("user-2"),
      ),
    ).toBe(true);
  });

  it("skips notifications when no extinguishers need attention", async () => {
    prisma.fireExtinguisher.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await scheduler.runExpiryCheck();

    expect(notifyPersonnel).not.toHaveBeenCalled();
  });
});
