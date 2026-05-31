import { createPrismaClient } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";
import { Role } from "../src/common/enums/role.enum";
import { UserStatus } from "../src/common/enums/user-status.enum";

const prisma = createPrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { expiryWarningDays: 30 },
    create: { id: "default", expiryWarningDays: 30 },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Alex Morgan",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
    },
    create: {
      email: "admin@example.com",
      name: "Alex Morgan",
      passwordHash,
      role: Role.admin,
      status: UserStatus.active,
      emailVerified: true,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {
      name: "Jane Customer",
      passwordHash,
      role: Role.customer,
      status: UserStatus.active,
      emailVerified: true,
      phone: "+1 (555) 123-4567",
    },
    create: {
      email: "customer@example.com",
      name: "Jane Customer",
      passwordHash,
      role: Role.customer,
      status: UserStatus.active,
      emailVerified: true,
      phone: "+1 (555) 123-4567",
    },
  });

  const customer = await prisma.customer.upsert({
    where: { email: "customer@example.com" },
    update: {
      name: "Jane Customer",
      phone: "+1 (555) 123-4567",
      address: "456 Oak Ave, Springfield",
      userId: customerUser.id,
    },
    create: {
      name: "Jane Customer",
      email: "customer@example.com",
      phone: "+1 (555) 123-4567",
      address: "456 Oak Ave, Springfield",
      userId: customerUser.id,
    },
  });

  const available = await prisma.fireExtinguisher.upsert({
    where: { serialNumber: "FE-NEW-001" },
    update: {
      type: "CO2",
      manufactureDate: new Date("2024-01-01"),
      expiryDate: new Date("2029-01-01"),
      status: "available",
      customerId: null,
    },
    create: {
      serialNumber: "FE-NEW-001",
      type: "CO2",
      manufactureDate: new Date("2024-01-01"),
      expiryDate: new Date("2029-01-01"),
      status: "available",
    },
  });

  const expiringSoon = await prisma.fireExtinguisher.upsert({
    where: { serialNumber: "FE-EXP-001" },
    update: {
      type: "ABC Dry Chemical",
      manufactureDate: new Date("2020-06-01"),
      expiryDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 15),
      status: "assigned",
      customerId: customer.id,
    },
    create: {
      serialNumber: "FE-EXP-001",
      type: "ABC Dry Chemical",
      manufactureDate: new Date("2020-06-01"),
      expiryDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 15),
      status: "assigned",
      customerId: customer.id,
    },
  });

  const active = await prisma.fireExtinguisher.upsert({
    where: { serialNumber: "FE-ACT-001" },
    update: {
      type: "Water Mist",
      manufactureDate: new Date("2023-03-01"),
      expiryDate: new Date("2028-03-01"),
      status: "assigned",
      customerId: customer.id,
    },
    create: {
      serialNumber: "FE-ACT-001",
      type: "Water Mist",
      manufactureDate: new Date("2023-03-01"),
      expiryDate: new Date("2028-03-01"),
      status: "assigned",
      customerId: customer.id,
    },
  });

  console.log("Seeded fire extinguisher management data.");
  console.log("Admin login: admin@example.com / password123");
  console.log("Customer login: customer@example.com / password123");
  console.log(`Sample units: ${available.serialNumber}, ${expiringSoon.serialNumber}, ${active.serialNumber}`);
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
