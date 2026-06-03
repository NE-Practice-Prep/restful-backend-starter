import { vi } from "vitest";

import { Role } from "@shared/common/enums/role.enum";
import {
  ComplianceStatus,
  ExtinguisherSize,
  ExtinguisherStatus,
  ExtinguisherType,
  InspectionResult,
  InspectionStatus,
  MaintenanceType,
  ReportStatus,
  ReportType,
} from "@shared/generated/prisma/enums";

export const BASE_DATE = new Date("2026-06-01T12:00:00Z");
export const FUTURE_DATE = new Date("2026-12-15T10:00:00Z");
export const EXPIRES_FAR = new Date("2030-01-01T00:00:00Z");
export const EXPIRES_SOON = new Date("2026-06-20T00:00:00Z");
export const EXPIRED = new Date("2025-01-01T00:00:00Z");

export function makeExtinguisher(overrides: Record<string, unknown> = {}) {
  return {
    id: "ext-1",
    assetTag: "FE-001",
    serialNumber: "FE-001",
    location: "Building A — floor 2",
    type: ExtinguisherType.co2,
    size: ExtinguisherSize.lbs_5,
    extinguisherClass: ExtinguisherType.co2,
    manufacturer: null,
    model: null,
    capacityKg: null,
    siteId: null,
    building: null,
    floor: null,
    room: null,
    mountingLocation: null,
    status: ExtinguisherStatus.in_service,
    complianceStatus: ComplianceStatus.compliant,
    manufacturedAt: null,
    installedAt: BASE_DATE,
    expiresAt: EXPIRES_FAR,
    lastInspectionAt: null,
    nextInspectionDue: null,
    lastMaintenanceAt: null,
    nextMaintenanceDue: null,
    pressurePsi: null,
    notes: "",
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    site: null,
    ...overrides,
  };
}

export function makeInspection(overrides: Record<string, unknown> = {}) {
  return {
    id: "insp-1",
    extinguisherId: "ext-1",
    inspectorId: null,
    requestedById: "user-1",
    scheduledAt: FUTURE_DATE,
    startedAt: null,
    completedAt: null,
    status: InspectionStatus.scheduled,
    result: InspectionResult.pending,
    pressureOk: null,
    sealIntact: null,
    gaugeReadable: null,
    accessible: null,
    findings: "",
    correctiveAction: "",
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    extinguisher: {
      id: "ext-1",
      serialNumber: "FE-001",
      location: "Building A — floor 2",
    },
    inspector: null,
    requestedBy: {
      id: "user-1",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
    },
    ...overrides,
  };
}

export function makeMaintenance(overrides: Record<string, unknown> = {}) {
  return {
    id: "maint-1",
    extinguisherId: "ext-1",
    inspectionId: null,
    performedById: "inspector-1",
    type: MaintenanceType.repair,
    description: "Replaced hose",
    conditionsNoted: "Minor corrosion on bracket",
    performedAt: BASE_DATE,
    nextDueAt: null,
    partsReplaced: "",
    cost: null,
    statusAfter: ExtinguisherStatus.in_service,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    extinguisher: {
      id: "ext-1",
      serialNumber: "FE-001",
      location: "Building A — floor 2",
    },
    performedBy: {
      id: "inspector-1",
      email: "inspector@example.com",
      firstName: "Ina",
      lastName: "Spector",
    },
    ...overrides,
  };
}

export function makeComplianceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "comp-1",
    extinguisherId: "ext-1",
    checkedById: "inspector-1",
    status: ComplianceStatus.compliant,
    regulationRef: "NFPA-10",
    notes: "",
    dueAt: EXPIRES_FAR,
    checkedAt: BASE_DATE,
    createdAt: BASE_DATE,
    extinguisher: {
      id: "ext-1",
      serialNumber: "FE-001",
      location: "Building A — floor 2",
    },
    checkedBy: {
      id: "inspector-1",
      email: "inspector@example.com",
      firstName: "Ina",
      lastName: "Spector",
    },
    ...overrides,
  };
}

export function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    type: ReportType.extinguisher_inventory,
    title: "Extinguisher inventory",
    parameters: {},
    status: ReportStatus.ready,
    generatedById: "user-1",
    fileUrl: null,
    rowCount: 1,
    errorMessage: null,
    requestedAt: BASE_DATE,
    completedAt: BASE_DATE,
    expiresAt: null,
    ...overrides,
  };
}

export function makeInspectorUser() {
  return {
    id: "inspector-1",
    email: "inspector@example.com",
    role: Role.inspector,
  };
}

export function makeFirePrisma() {
  return {
    fireExtinguisher: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
    site: { findUnique: vi.fn() },
    inspection: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    maintenanceRecord: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    complianceRecord: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    report: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    notification: { createMany: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  };
}
