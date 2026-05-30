import { createPrismaClient } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";
import { Role } from "../src/common/enums/role.enum";
import { UserStatus } from "../src/common/enums/user-status.enum";

const prisma = createPrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {
        name: "Alex Morgan",
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
        name: "Alex Morgan",
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
        name: "Olivia Martin",
        passwordHash,
        role: Role.admin,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+1 (415) 555-0132",
        location: "San Francisco, US",
      },
      create: {
        email: "olivia.martin@corelogic.io",
        name: "Olivia Martin",
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
        name: "Jackson Lee",
        passwordHash,
        role: Role.editor,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+1 (212) 555-0188",
        location: "New York, US",
      },
      create: {
        email: "jackson.lee@corelogic.io",
        name: "Jackson Lee",
        passwordHash,
        role: Role.editor,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+1 (212) 555-0188",
        location: "New York, US",
      },
    }),
    prisma.user.upsert({
      where: { email: "william.kim@corelogic.io" },
      update: {
        name: "William Kim",
        passwordHash,
        role: Role.viewer,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+44 20 7946 0991",
        location: "London, UK",
      },
      create: {
        email: "william.kim@corelogic.io",
        name: "William Kim",
        passwordHash,
        role: Role.viewer,
        status: UserStatus.active,
        emailVerified: true,
        phone: "+44 20 7946 0991",
        location: "London, UK",
      },
    }),
  ]);

  console.log(`Seeded ${users.length} users.`);
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
