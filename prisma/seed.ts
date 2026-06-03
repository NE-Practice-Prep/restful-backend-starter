import { createPrismaClient } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";
import { Role } from "../src/common/enums/role.enum";
import { UserStatus } from "../src/common/enums/user-status.enum";
import { ExtinguisherType } from "../src/common/enums/extinguisher-type.enum";
import { ExtinguisherSize } from "../src/common/enums/extinguisher-size.enum";

const prisma = createPrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {
        firstName: "Alex",
        lastName: "Morgan",
        passwordHash,
        role: Role.admin,
        status: UserStatus.active,
        emailVerified: true,
        bio: "Product operations lead focused on data quality and platform reliability.",
        location: "San Francisco, US",
        phone: "+1 (415) 555-0100",
      },
      create: {
        email: "admin@example.com",
        firstName: "Alex",
        lastName: "Morgan",
        passwordHash,
        role: Role.admin,
        status: UserStatus.active,
        emailVerified: true,
        bio: "Product operations lead focused on data quality and platform reliability.",
        location: "San Francisco, US",
        phone: "+1 (415) 555-0100",
      },
    }),
    prisma.user.upsert({
      where: { email: "olivia.martin@corelogic.io" },
      update: {
        firstName: "Olivia",
        lastName: "Martin",
        passwordHash,
        role: Role.admin,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+1 (415) 555-0132",
        location: "San Francisco, US",
      },
      create: {
        email: "olivia.martin@corelogic.io",
        firstName: "Olivia",
        lastName: "Martin",
        passwordHash,
        role: Role.admin,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+1 (415) 555-0132",
        location: "San Francisco, US",
      },
    }),
    prisma.user.upsert({
      where: { email: "jackson.lee@corelogic.io" },
      update: {
        firstName: "Jackson",
        lastName: "Lee",
        passwordHash,
        role: Role.inspector,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+1 (212) 555-0188",
        location: "New York, US",
      },
      create: {
        email: "jackson.lee@corelogic.io",
        firstName: "Jackson",
        lastName: "Lee",
        passwordHash,
        role: Role.inspector,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+1 (212) 555-0188",
        location: "New York, US",
      },
    }),
    prisma.user.upsert({
      where: { email: "william.kim@corelogic.io" },
      update: {
        firstName: "William",
        lastName: "Kim",
        passwordHash,
        role: Role.user,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+44 20 7946 0991",
        location: "London, UK",
      },
      create: {
        email: "william.kim@corelogic.io",
        firstName: "William",
        lastName: "Kim",
        passwordHash,
        role: Role.user,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+44 20 7946 0991",
        location: "London, UK",
      },
    }),
  ]);

  const site = await prisma.site.upsert({
    where: { code: "HQ" },
    update: { name: "Headquarters" },
    create: {
      name: "Headquarters",
      code: "HQ",
      address: "100 Market Street",
      city: "San Francisco",
      state: "CA",
      country: "US",
    },
  });

  const installedAt = new Date("2024-01-15");
  const expiresAt = new Date("2029-01-15");

  await prisma.fireExtinguisher.upsert({
    where: { serialNumber: "FE-2024-00142" },
    update: {
      location: "Building A — 2nd floor, east stairwell",
      type: ExtinguisherType.co2,
      size: ExtinguisherSize.lbs_5,
      installedAt,
      expiresAt,
      siteId: site.id,
    },
    create: {
      assetTag: "FE-2024-00142",
      serialNumber: "FE-2024-00142",
      location: "Building A — 2nd floor, east stairwell",
      type: ExtinguisherType.co2,
      size: ExtinguisherSize.lbs_5,
      extinguisherClass: ExtinguisherType.co2,
      installedAt,
      expiresAt,
      siteId: site.id,
    },
  });

  await prisma.fireExtinguisher.upsert({
    where: { serialNumber: "FE-2024-00208" },
    update: {
      location: "Warehouse — loading bay 3",
      type: ExtinguisherType.dry_chemical,
      size: ExtinguisherSize.lbs_9,
      installedAt,
      expiresAt,
      siteId: site.id,
    },
    create: {
      assetTag: "FE-2024-00208",
      serialNumber: "FE-2024-00208",
      location: "Warehouse — loading bay 3",
      type: ExtinguisherType.dry_chemical,
      size: ExtinguisherSize.lbs_9,
      extinguisherClass: ExtinguisherType.dry_chemical,
      installedAt,
      expiresAt,
      siteId: site.id,
    },
  });

  console.log(`Seeded ${users.length} users and sample fire extinguishers.`);
  console.log("Admin login: admin@example.com / password123");
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
