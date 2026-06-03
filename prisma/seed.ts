import { createPrismaClient } from "../libs/shared/src/lib/prisma";
import * as bcrypt from "bcrypt";
import { Role } from "../libs/shared/src/common/enums/role.enum";
import { UserStatus } from "../libs/shared/src/common/enums/user-status.enum";
import {
  ExtinguisherSize,
  ExtinguisherStatus,
  ExtinguisherType,
  InspectionStatus,
} from "../libs/shared/src/generated/prisma/enums";

const prisma = createPrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const testPasswordHash = await bcrypt.hash("1234qwerty", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@tzw.local" },
    update: {
      firstName: "Taylor",
      lastName: "Admin",
      name: "Taylor Admin",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
      location: "TZW HQ",
      phone: "+1 (555) 010-0001",
    },
    create: {
      email: "admin@tzw.local",
      firstName: "Taylor",
      lastName: "Admin",
      name: "Taylor Admin",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
      location: "TZW HQ",
      phone: "+1 (555) 010-0001",
    },
  });

  const inspector = await prisma.user.upsert({
    where: { email: "inspector@tzw.local" },
    update: {
      firstName: "Jordan",
      lastName: "Inspector",
      name: "Jordan Inspector",
      passwordHash,
      role: Role.editor,
      status: UserStatus.active,
      emailVerified: true,
      location: "Field — North District",
      phone: "+1 (555) 010-0002",
    },
    create: {
      email: "inspector@tzw.local",
      firstName: "Jordan",
      lastName: "Inspector",
      name: "Jordan Inspector",
      passwordHash,
      role: Role.editor,
      status: UserStatus.active,
      emailVerified: true,
      location: "Field — North District",
      phone: "+1 (555) 010-0002",
    },
  });

  // Optional campus demo accounts (password123)
  const rcaAdmin = await prisma.user.upsert({
    where: { email: "admin@rca.tzw.local" },
    update: {
      firstName: "Alice",
      lastName: "Uwimana",
      name: "Alice Uwimana",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
      location: "Campus — Admin office",
    },
    create: {
      email: "admin@rca.tzw.local",
      firstName: "Alice",
      lastName: "Uwimana",
      name: "Alice Uwimana",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
      location: "Campus — Admin office",
    },
  });

  const rcaInspector = await prisma.user.upsert({
    where: { email: "inspector@rca.tzw.local" },
    update: {
      firstName: "Eric",
      lastName: "Habimana",
      name: "Eric Habimana",
      passwordHash,
      role: Role.editor,
      status: UserStatus.active,
      emailVerified: true,
      location: "Campus — Field",
    },
    create: {
      email: "inspector@rca.tzw.local",
      firstName: "Eric",
      lastName: "Habimana",
      name: "Eric Habimana",
      passwordHash,
      role: Role.editor,
      status: UserStatus.active,
      emailVerified: true,
      location: "Campus — Field",
    },
  });

  const rcaUser = await prisma.user.upsert({
    where: { email: "user@rca.tzw.local" },
    update: {
      firstName: "Grace",
      lastName: "Mukamana",
      name: "Grace Mukamana",
      passwordHash,
      role: Role.viewer,
      status: UserStatus.active,
      emailVerified: true,
      location: "Campus — Facilities",
    },
    create: {
      email: "user@rca.tzw.local",
      firstName: "Grace",
      lastName: "Mukamana",
      name: "Grace Mukamana",
      passwordHash,
      role: Role.viewer,
      status: UserStatus.active,
      emailVerified: true,
      location: "Campus — Facilities",
    },
  });

  const facilityUser = await prisma.user.upsert({
    where: { email: "user@tzw.local" },
    update: {
      firstName: "Sam",
      lastName: "Facility",
      name: "Sam Facility",
      passwordHash,
      role: Role.viewer,
      status: UserStatus.active,
      emailVerified: true,
      location: "Building A",
      phone: "+1 (555) 010-0003",
    },
    create: {
      email: "user@tzw.local",
      firstName: "Sam",
      lastName: "Facility",
      name: "Sam Facility",
      passwordHash,
      role: Role.viewer,
      status: UserStatus.active,
      emailVerified: true,
      location: "Building A",
      phone: "+1 (555) 010-0003",
    },
  });

  // Primary test accounts (requested for QA)
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      firstName: "Alex",
      lastName: "Morgan",
      name: "Alex Morgan",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
      location: "TZW HQ",
    },
    create: {
      email: "admin@example.com",
      firstName: "Alex",
      lastName: "Morgan",
      name: "Alex Morgan",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
      location: "TZW HQ",
    },
  });

  await prisma.user.upsert({
    where: { email: "samuellamugisha207@gmail.com" },
    update: {
      firstName: "Samuel",
      lastName: "Facility",
      name: "Samuel Facility",
      passwordHash: testPasswordHash,
      role: Role.viewer,
      status: UserStatus.active,
      emailVerified: true,
      location: "Building A",
    },
    create: {
      email: "samuellamugisha207@gmail.com",
      firstName: "Samuel",
      lastName: "Facility",
      name: "Samuel Facility",
      passwordHash: testPasswordHash,
      role: Role.viewer,
      status: UserStatus.active,
      emailVerified: true,
      location: "Building A",
    },
  });

  await prisma.user.upsert({
    where: { email: "samuellamugisha964@gmail.com" },
    update: {
      firstName: "Samuel",
      lastName: "Inspector",
      name: "Samuel Inspector",
      passwordHash: testPasswordHash,
      role: Role.editor,
      status: UserStatus.active,
      emailVerified: true,
      location: "Field — North District",
    },
    create: {
      email: "samuellamugisha964@gmail.com",
      firstName: "Samuel",
      lastName: "Inspector",
      name: "Samuel Inspector",
      passwordHash: testPasswordHash,
      role: Role.editor,
      status: UserStatus.active,
      emailVerified: true,
      location: "Field — North District",
    },
  });

  const installDate = new Date("2023-06-01");
  const expiryDate = new Date("2028-06-01");
  const soonExpiry = new Date();
  soonExpiry.setDate(soonExpiry.getDate() + 20);

  const extinguisherDefs = [
    {
      serialNumber: "TZW-FE-001",
      location: "Building A — Lobby",
      type: ExtinguisherType.CO2,
      size: ExtinguisherSize.Size5lb,
      installationDate: installDate,
      expiryDate,
      status: ExtinguisherStatus.active,
    },
    {
      serialNumber: "TZW-FE-002",
      location: "Building A — Floor 2 East",
      type: ExtinguisherType.Water,
      size: ExtinguisherSize.Size9lb,
      installationDate: installDate,
      expiryDate: soonExpiry,
      status: ExtinguisherStatus.active,
    },
    {
      serialNumber: "TZW-FE-003",
      location: "Warehouse B — Loading dock",
      type: ExtinguisherType.DryChemical,
      size: ExtinguisherSize.Size12lb,
      installationDate: new Date("2020-01-10"),
      expiryDate: new Date("2024-12-31"),
      status: ExtinguisherStatus.expired,
    },
    {
      serialNumber: "TZW-FE-004",
      location: "Building C — Kitchen",
      type: ExtinguisherType.Foam,
      size: ExtinguisherSize.Size1_5lb,
      installationDate: installDate,
      expiryDate,
      status: ExtinguisherStatus.maintenance_required,
    },
    {
      serialNumber: "RCA-FE-101",
      location: "Campus — Main lab",
      type: ExtinguisherType.CO2,
      size: ExtinguisherSize.Size5lb,
      installationDate: installDate,
      expiryDate,
      status: ExtinguisherStatus.active,
    },
    {
      serialNumber: "RCA-FE-102",
      location: "Campus — Server room",
      type: ExtinguisherType.CO2,
      size: ExtinguisherSize.Size9lb,
      installationDate: installDate,
      expiryDate: soonExpiry,
      status: ExtinguisherStatus.active,
    },
    {
      serialNumber: "RCA-FE-103",
      location: "Campus — Cafeteria",
      type: ExtinguisherType.Foam,
      size: ExtinguisherSize.Size12lb,
      installationDate: new Date("2019-03-01"),
      expiryDate: new Date("2024-08-01"),
      status: ExtinguisherStatus.expired,
    },
  ];

  const extinguishers = [];
  for (const def of extinguisherDefs) {
    const row = await prisma.fireExtinguisher.upsert({
      where: { serialNumber: def.serialNumber },
      update: def,
      create: def,
    });
    extinguishers.push(row);
  }

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);
  yesterday.setHours(0, 0, 0, 0);

  const rcaLab = extinguishers.find((e) => e.serialNumber === "RCA-FE-101");
  const rcaServer = extinguishers.find((e) => e.serialNumber === "RCA-FE-102");

  await prisma.inspection.deleteMany({
    where: { extinguisherId: { in: extinguishers.map((e) => e.id) } },
  });

  await prisma.inspection.createMany({
    data: [
      {
        extinguisherId: extinguishers[0].id,
        scheduledByUserId: facilityUser.id,
        scheduledDate: nextWeek,
        scheduledTime: "09:00",
        status: InspectionStatus.scheduled,
      },
      {
        extinguisherId: extinguishers[1].id,
        scheduledByUserId: facilityUser.id,
        scheduledDate: yesterday,
        scheduledTime: "14:00",
        status: InspectionStatus.overdue,
      },
      {
        extinguisherId: extinguishers[0].id,
        scheduledByUserId: admin.id,
        scheduledDate: new Date("2025-11-01"),
        scheduledTime: "10:30",
        status: InspectionStatus.completed,
        completedAt: new Date("2025-11-01T10:45:00Z"),
        notes: "Pressure gauge in normal range.",
      },
      ...(rcaLab && rcaServer
        ? [
            {
              extinguisherId: rcaLab.id,
              scheduledByUserId: rcaUser.id,
              scheduledDate: today,
              scheduledTime: "09:30",
              status: InspectionStatus.scheduled,
            },
            {
              extinguisherId: rcaServer.id,
              scheduledByUserId: rcaUser.id,
              scheduledDate: nextWeek,
              scheduledTime: "11:00",
              status: InspectionStatus.scheduled,
            },
            {
              extinguisherId: rcaServer.id,
              scheduledByUserId: rcaUser.id,
              scheduledDate: yesterday,
              scheduledTime: "14:00",
              status: InspectionStatus.overdue,
            },
          ]
        : []),
    ],
  });

  await prisma.maintenanceLog.deleteMany({
    where: { extinguisherId: extinguishers[3].id },
  });

  await prisma.maintenanceLog.create({
    data: {
      extinguisherId: extinguishers[3].id,
      inspectorUserId: inspector.id,
      actionTaken: "Recharged foam unit and replaced safety pin",
      maintenanceDate: new Date("2025-10-15"),
      issuesIdentified: "Low pressure reading on prior inspection",
      notes: "Unit returned to active service pending follow-up inspection.",
    },
  });

  console.log("TZW seed complete.");
  console.log("Primary test accounts:");
  console.log("  admin@example.com / password123 (Administrator)");
  console.log("  samuellamugisha207@gmail.com / 1234qwerty (User)");
  console.log("  samuellamugisha964@gmail.com / 1234qwerty (Inspector)");
  console.log("Additional demo accounts (password123):");
  console.log("  admin@tzw.local / inspector@tzw.local / user@tzw.local");
  console.log("  admin@rca.tzw.local / inspector@rca.tzw.local / user@rca.tzw.local");
  console.log(`  ${extinguishers.length} fire extinguishers, sample inspections & maintenance`);
  console.log("Configure SMTP_* in .env for email alerts (expiry, inspections, invitations).");
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
