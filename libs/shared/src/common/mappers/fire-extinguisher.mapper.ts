import type {
  ComplianceRecord,
  FireExtinguisher,
  Inspection,
  MaintenanceRecord,
  Report,
  Site,
  User,
} from "../../generated/prisma/client";

type ExtinguisherRow = FireExtinguisher & { site?: Site | null };

type InspectionRow = Inspection & {
  extinguisher?: Pick<FireExtinguisher, "id" | "serialNumber" | "location"> | null;
  inspector?: Pick<User, "id" | "email" | "firstName" | "lastName"> | null;
  requestedBy?: Pick<User, "id" | "email" | "firstName" | "lastName"> | null;
};

type MaintenanceRow = MaintenanceRecord & {
  extinguisher?: Pick<FireExtinguisher, "id" | "serialNumber" | "location"> | null;
  performedBy?: Pick<User, "id" | "email" | "firstName" | "lastName"> | null;
};

type ComplianceRow = ComplianceRecord & {
  extinguisher?: Pick<FireExtinguisher, "id" | "serialNumber" | "location"> | null;
  checkedBy?: Pick<User, "id" | "email" | "firstName" | "lastName"> | null;
};

export function toPublicSite(row: Site) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicExtinguisher(row: ExtinguisherRow) {
  return {
    id: row.id,
    serialNumber: row.serialNumber,
    location: row.location,
    type: row.type,
    size: row.size,
    status: row.status,
    complianceStatus: row.complianceStatus,
    installedAt: row.installedAt,
    expiresAt: row.expiresAt,
    lastInspectionAt: row.lastInspectionAt,
    nextInspectionDue: row.nextInspectionDue,
    lastMaintenanceAt: row.lastMaintenanceAt,
    nextMaintenanceDue: row.nextMaintenanceDue,
    notes: row.notes,
    site: row.site
      ? { id: row.site.id, name: row.site.name, code: row.site.code }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicInspection(row: InspectionRow) {
  return {
    id: row.id,
    extinguisherId: row.extinguisherId,
    extinguisher: row.extinguisher ?? null,
    inspectorId: row.inspectorId,
    inspector: row.inspector ?? null,
    requestedById: row.requestedById,
    requestedBy: row.requestedBy ?? null,
    scheduledAt: row.scheduledAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    status: row.status,
    result: row.result,
    pressureOk: row.pressureOk,
    sealIntact: row.sealIntact,
    gaugeReadable: row.gaugeReadable,
    accessible: row.accessible,
    findings: row.findings,
    correctiveAction: row.correctiveAction,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicMaintenance(row: MaintenanceRow) {
  return {
    id: row.id,
    extinguisherId: row.extinguisherId,
    extinguisher: row.extinguisher ?? null,
    inspectionId: row.inspectionId,
    performedById: row.performedById,
    performedBy: row.performedBy ?? null,
    type: row.type,
    description: row.description,
    conditionsNoted: row.conditionsNoted,
    performedAt: row.performedAt,
    nextDueAt: row.nextDueAt,
    partsReplaced: row.partsReplaced,
    cost: row.cost,
    statusAfter: row.statusAfter,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicCompliance(row: ComplianceRow) {
  return {
    id: row.id,
    extinguisherId: row.extinguisherId,
    extinguisher: row.extinguisher ?? null,
    checkedById: row.checkedById,
    checkedBy: row.checkedBy ?? null,
    status: row.status,
    regulationRef: row.regulationRef,
    notes: row.notes,
    dueAt: row.dueAt,
    checkedAt: row.checkedAt,
    createdAt: row.createdAt,
  };
}

export function toPublicReport(row: Report) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    parameters: row.parameters,
    status: row.status,
    generatedById: row.generatedById,
    fileUrl: row.fileUrl,
    rowCount: row.rowCount,
    errorMessage: row.errorMessage,
    requestedAt: row.requestedAt,
    completedAt: row.completedAt,
    expiresAt: row.expiresAt,
  };
}
