import { createPrismaClient } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";
import { Role } from "../src/common/enums/role.enum";

const prisma = createPrismaClient();

async function main() {
  const alicePasswordHash = await bcrypt.hash("password123", 10);
  const bobPasswordHash = await bcrypt.hash("password123", 10);
  const carolPasswordHash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@prisma.io" },
      update: { name: "Alice", passwordHash: alicePasswordHash, roles: [Role.ADMIN], isActive: true },
      create: {
        email: "alice@prisma.io",
        name: "Alice",
        passwordHash: alicePasswordHash,
        roles: [Role.ADMIN],
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@prisma.io" },
      update: { name: "Bob", passwordHash: bobPasswordHash, roles: [Role.USER], isActive: true },
      create: {
        email: "bob@prisma.io",
        name: "Bob",
        passwordHash: bobPasswordHash,
        roles: [Role.USER],
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "carol@prisma.io" },
      update: { name: "Carol", passwordHash: carolPasswordHash, roles: [Role.MODERATOR], isActive: true },
      create: {
        email: "carol@prisma.io",
        name: "Carol",
        passwordHash: carolPasswordHash,
        roles: [Role.MODERATOR],
        isActive: true,
      },
    }),
  ]);

  console.log(`Seeded ${users.length} users.`);
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
