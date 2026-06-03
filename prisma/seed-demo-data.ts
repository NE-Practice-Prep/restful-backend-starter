import { createPrismaClient } from "../libs/shared/src/lib/prisma";
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
  RequestStatus,
  UserRole,
} from "../libs/shared/src/generated/prisma/enums";

const prisma = createPrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const force = process.argv.includes("--force");

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
  });

  if (users.length === 0) {
    throw new Error("No users in database. Create users first, then run this script.");
  }

  const existingDemoCount = await prisma.fireExtinguisher.count({
    where: { serialNumber: { startsWith: "FE-DEMO-" } },
  });
  if (existingDemoCount >= 24 && !force) {
    console.log(
      `Demo data already present (${existingDemoCount} demo extinguishers). Pass --force to add another batch.`,
    );
    return;
  }

  const admin = users.find((u) => u.role === UserRole.admin) ?? users[0];
  const inspectors = users.filter((u) => u.role === UserRole.inspector);
  const inspector = inspectors[0] ?? admin;
  const regularUsers = users.filter((u) => u.role === UserRole.user);
  const requesters = regularUsers.length > 0 ? regularUsers : users;

  console.log(`Found ${users.length} user(s). Seeding demo data (no new users)...`);

  const siteDefs = [
    { code: "HQ", name: "Headquarters", city: "San Francisco", state: "CA", address: "100 Market Street" },
    { code: "WH-N", name: "North Warehouse", city: "Oakland", state: "CA", address: "2200 Harbor Way" },
    { code: "WH-S", name: "South Distribution", city: "San Jose", state: "CA", address: "4500 Industrial Blvd" },
    { code: "LAB", name: "R&D Lab", city: "Palo Alto", state: "CA", address: "800 Research Park" },
    { code: "RET-01", name: "Retail Store #1", city: "Sacramento", state: "CA", address: "12 Capitol Mall" },
  ];

  const sites = await Promise.all(
    siteDefs.map((s) =>
      prisma.site.upsert({
        where: { code: s.code },
        update: { name: s.name, city: s.city, state: s.state, address: s.address, isActive: true },
        create: { ...s, country: "US", postalCode: "94105", isActive: true },
      }),
    ),
  );

  const types = [
    ExtinguisherType.co2,
    ExtinguisherType.dry_chemical,
    ExtinguisherType.foam,
    ExtinguisherType.water,
  ];
  const sizes = [
    ExtinguisherSize.lbs_2_5,
    ExtinguisherSize.lbs_5,
    ExtinguisherSize.lbs_9,
    ExtinguisherSize.lbs_12,
  ];
  const statuses = [
    ExtinguisherStatus.in_service,
    ExtinguisherStatus.needs_inspection,
    ExtinguisherStatus.needs_maintenance,
    ExtinguisherStatus.in_service,
    ExtinguisherStatus.out_of_service,
  ];
  const complianceStatuses = [
    ComplianceStatus.compliant,
    ComplianceStatus.compliant,
    ComplianceStatus.expiring_soon,
    ComplianceStatus.non_compliant,
    ComplianceStatus.unknown,
  ];

  const extinguishers = [];
  for (let i = 1; i <= 24; i++) {
    const serial = `FE-DEMO-${String(i).padStart(4, "0")}`;
    const site = sites[i % sites.length];
    const assignee = i % 3 === 0 ? requesters[i % requesters.length] : null;
    const ext = await prisma.fireExtinguisher.upsert({
      where: { serialNumber: serial },
      update: {},
      create: {
        assetTag: `TAG-${serial}`,
        serialNumber: serial,
        location: `Building ${String.fromCharCode(65 + (i % 4))} — Floor ${(i % 5) + 1}`,
        type: types[i % types.length],
        size: sizes[i % sizes.length],
        extinguisherClass: types[i % types.length],
        manufacturer: i % 2 === 0 ? "Amerex" : "Kidde",
        model: `Model-${100 + i}`,
        capacityKg: 2.5 + (i % 4) * 2,
        siteId: site.id,
        assignedToId: assignee?.id,
        building: `Building ${String.fromCharCode(65 + (i % 4))}`,
        floor: String((i % 5) + 1),
        room: i % 2 === 0 ? `Room ${100 + i}` : undefined,
        mountingLocation: i % 3 === 0 ? "Near exit" : "Corridor",
        status: statuses[i % statuses.length],
        complianceStatus: complianceStatuses[i % complianceStatuses.length],
        manufacturedAt: daysAgo(365 * 3 + i * 10),
        installedAt: daysAgo(180 + i * 5),
        expiresAt: daysFromNow(365 * 2 - i * 10),
        lastInspectionAt: i % 4 !== 0 ? daysAgo(30 + i) : null,
        nextInspectionDue: daysFromNow(14 + (i % 30)),
        lastMaintenanceAt: i % 5 === 0 ? daysAgo(60) : null,
        nextMaintenanceDue: daysFromNow(90 + i),
        pressurePsi: 100 + (i % 20),
        notes: i % 6 === 0 ? "Demo unit — check gauge monthly" : "",
      },
    });
    extinguishers.push(ext);
  }

  const inspectionStatuses = [
    InspectionStatus.completed,
    InspectionStatus.completed,
    InspectionStatus.scheduled,
    InspectionStatus.in_progress,
    InspectionStatus.overdue,
    InspectionStatus.cancelled,
  ];
  const inspectionResults = [
    InspectionResult.pass,
    InspectionResult.pass,
    InspectionResult.fail,
    InspectionResult.conditional,
    InspectionResult.pending,
  ];

  const inspections = [];
  for (let i = 0; i < 18; i++) {
    const ext = extinguishers[i % extinguishers.length];
    const status = inspectionStatuses[i % inspectionStatuses.length];
    const completed = status === InspectionStatus.completed;
    const insp = await prisma.inspection.create({
      data: {
        extinguisherId: ext.id,
        inspectorId: inspector.id,
        requestedById: requesters[i % requesters.length].id,
        scheduledAt: daysAgo(45 - i * 2),
        startedAt: status !== InspectionStatus.scheduled ? daysAgo(44 - i * 2) : null,
        completedAt: completed ? daysAgo(43 - i * 2) : null,
        status,
        result: completed
          ? inspectionResults[i % 3]
          : InspectionResult.pending,
        pressureOk: completed ? i % 4 !== 2 : null,
        sealIntact: completed ? true : null,
        gaugeReadable: completed ? true : null,
        accessible: completed ? i % 5 !== 0 : null,
        findings: completed && i % 4 === 2 ? "Minor corrosion on bracket" : "",
        correctiveAction: completed && i % 4 === 2 ? "Schedule bracket replacement" : "",
      },
    });
    inspections.push(insp);
  }

  for (let i = 0; i < 12; i++) {
    const ext = extinguishers[i];
    const linkedInspection = inspections.find(
      (insp) => insp.extinguisherId === ext.id && insp.status === InspectionStatus.completed,
    );
    await prisma.maintenanceRecord.create({
      data: {
        extinguisherId: ext.id,
        inspectionId: linkedInspection?.id,
        performedById: inspector.id,
        type: [
          MaintenanceType.annual_service,
          MaintenanceType.refill,
          MaintenanceType.repair,
          MaintenanceType.inspection_followup,
          MaintenanceType.hydrostatic_test,
          MaintenanceType.recharge,
        ][i % 6],
        description: [
          "Annual service completed",
          "Refilled after discharge test",
          "Replaced damaged hose",
          "Follow-up from failed inspection",
          "Hydrostatic test passed",
          "Recharged unit to spec",
        ][i % 6],
        conditionsNoted: i % 3 === 0 ? "Normal wear" : "",
        performedAt: daysAgo(20 + i * 3),
        nextDueAt: daysFromNow(180 + i * 10),
        partsReplaced: i % 2 === 0 ? "O-ring, gauge" : "",
        cost: 45 + i * 12.5,
        statusAfter: ExtinguisherStatus.in_service,
      },
    });
  }

  for (let i = 0; i < 16; i++) {
    const ext = extinguishers[i % extinguishers.length];
    await prisma.complianceRecord.create({
      data: {
        extinguisherId: ext.id,
        checkedById: admin.id,
        status: complianceStatuses[i % complianceStatuses.length],
        regulationRef: i % 2 === 0 ? "NFPA 10 §7.2" : "OSHA 1910.157",
        notes: i % 4 === 0 ? "Documented in quarterly audit" : "",
        dueAt: daysFromNow(30 + i * 7),
        checkedAt: daysAgo(5 + i),
      },
    });
  }

  const notificationTypes = [
    "inspection_due",
    "maintenance_required",
    "compliance_alert",
    "request_approved",
    "report_ready",
  ];
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: notificationTypes[i % notificationTypes.length],
        title: [
          "Inspection due soon",
          "Maintenance required",
          "Compliance expiring",
          "Request approved",
          "Report ready to download",
        ][i % 5],
        message: `Demo notification #${i + 1} for ${user.firstName} ${user.lastName}.`,
        read: i % 3 === 0,
        createdAt: daysAgo(i),
      },
    });
  }

  const reportDefs = [
    { type: ReportType.extinguisher_inventory, title: "Q2 Inventory Snapshot", status: ReportStatus.ready, rowCount: 24 },
    { type: ReportType.inspection_summary, title: "Monthly Inspection Summary", status: ReportStatus.ready, rowCount: 18 },
    { type: ReportType.maintenance_log, title: "Maintenance Log — YTD", status: ReportStatus.generating, rowCount: null },
    { type: ReportType.compliance_overview, title: "Compliance Overview", status: ReportStatus.pending, rowCount: null },
    { type: ReportType.custom, title: "Site HQ Custom Export", status: ReportStatus.failed, rowCount: null },
  ];
  for (let i = 0; i < reportDefs.length; i++) {
    const def = reportDefs[i];
    const existing = await prisma.report.findFirst({
      where: { title: def.title, generatedById: admin.id },
    });
    if (!existing) {
      await prisma.report.create({
        data: {
          type: def.type,
          title: def.title,
          parameters: { siteCode: sites[i % sites.length].code, demo: true },
          status: def.status,
          generatedById: admin.id,
          rowCount: def.rowCount,
          fileUrl: def.status === ReportStatus.ready ? `/reports/demo-${i + 1}.pdf` : null,
          errorMessage: def.status === ReportStatus.failed ? "Demo: export timeout" : null,
          requestedAt: daysAgo(7 - i),
          completedAt: def.status === ReportStatus.ready ? daysAgo(6 - i) : null,
          expiresAt: def.status === ReportStatus.ready ? daysFromNow(30) : null,
        },
      });
    }
  }

  const requestStatuses = [
    RequestStatus.pending,
    RequestStatus.pending,
    RequestStatus.approved,
    RequestStatus.rejected,
    RequestStatus.cancelled,
  ];
  for (let i = 0; i < 10; i++) {
    const requester = requesters[i % requesters.length];
    const status = requestStatuses[i % requestStatuses.length];
    const reviewed = status === RequestStatus.approved || status === RequestStatus.rejected;
    const existing = await prisma.extinguisherRequest.findFirst({
      where: {
        requestedById: requester.id,
        notes: `Demo request batch ${i + 1}`,
      },
    });
    if (!existing) {
      await prisma.extinguisherRequest.create({
        data: {
          requestedById: requester.id,
          extinguisherId: i % 2 === 0 ? extinguishers[i % extinguishers.length].id : null,
          quantity: 1 + (i % 3),
          type: types[i % types.length],
          size: sizes[i % sizes.length],
          notes: `Demo request batch ${i + 1}`,
          status,
          reviewedById: reviewed ? admin.id : null,
          reviewedAt: reviewed ? daysAgo(2 + i) : null,
          reviewNotes: reviewed
            ? status === RequestStatus.approved
              ? "Approved for deployment"
              : "Insufficient justification"
            : "",
        },
      });
    }
  }

  console.log("Demo data seeded:");
  console.log(`  Sites: ${sites.length}`);
  console.log(`  Fire extinguishers: ${extinguishers.length}`);
  console.log(`  Inspections: ${inspections.length}`);
  console.log("  Maintenance records: 12");
  console.log("  Compliance records: 16");
  console.log("  Notifications: 20");
  console.log("  Reports: up to 5");
  console.log("  Extinguisher requests: up to 10");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
