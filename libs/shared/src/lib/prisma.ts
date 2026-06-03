/** Prisma client factory — all microservices share one DATABASE_URL and schema. */
/**
 * Creates the Prisma client used by every microservice (same DATABASE_URL / one database).
 */
import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const rawDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = (rawDatabaseUrl ?? "").trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

export const prismaClientOptions = { adapter };

export function createPrismaClient() {
  return new PrismaClient(prismaClientOptions);
}
