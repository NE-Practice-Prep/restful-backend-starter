-- CreateEnum
CREATE TYPE "ExtinguisherType" AS ENUM ('water', 'co2', 'foam', 'dry_chemical');

-- CreateEnum
CREATE TYPE "ExtinguisherSize" AS ENUM ('lbs_2_5', 'lbs_5', 'lbs_9', 'lbs_12');

-- AlterTable: add new columns with temporary defaults for existing rows
ALTER TABLE "FireExtinguisher" ADD COLUMN "location" TEXT;
ALTER TABLE "FireExtinguisher" ADD COLUMN "type" "ExtinguisherType";
ALTER TABLE "FireExtinguisher" ADD COLUMN "size" "ExtinguisherSize";
ALTER TABLE "FireExtinguisher" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "FireExtinguisher" ALTER COLUMN "extinguisherClass" SET DEFAULT '';

-- Backfill from legacy columns where present
UPDATE "FireExtinguisher"
SET
  "location" = COALESCE("mountingLocation", "building", 'Unassigned'),
  "type" = CASE
    WHEN LOWER("extinguisherClass") IN ('water', 'co2', 'foam', 'dry_chemical') THEN LOWER("extinguisherClass")::"ExtinguisherType"
    WHEN LOWER("extinguisherClass") LIKE '%co2%' THEN 'co2'::"ExtinguisherType"
    WHEN LOWER("extinguisherClass") LIKE '%foam%' THEN 'foam'::"ExtinguisherType"
    WHEN LOWER("extinguisherClass") LIKE '%dry%' THEN 'dry_chemical'::"ExtinguisherType"
    ELSE 'water'::"ExtinguisherType"
  END,
  "size" = 'lbs_5'::"ExtinguisherSize",
  "expiresAt" = COALESCE("installedAt", NOW()) + INTERVAL '5 years',
  "serialNumber" = COALESCE("serialNumber", "assetTag"),
  "installedAt" = COALESCE("installedAt", NOW())
WHERE "location" IS NULL;

ALTER TABLE "FireExtinguisher" ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "FireExtinguisher" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "FireExtinguisher" ALTER COLUMN "size" SET NOT NULL;
ALTER TABLE "FireExtinguisher" ALTER COLUMN "expiresAt" SET NOT NULL;
ALTER TABLE "FireExtinguisher" ALTER COLUMN "installedAt" SET NOT NULL;
ALTER TABLE "FireExtinguisher" ALTER COLUMN "serialNumber" SET NOT NULL;

-- Drop duplicate unique on assetTag if serial matches; keep both indexes
CREATE UNIQUE INDEX IF NOT EXISTS "FireExtinguisher_serialNumber_key" ON "FireExtinguisher"("serialNumber");

-- siteId optional
ALTER TABLE "FireExtinguisher" DROP CONSTRAINT "FireExtinguisher_siteId_fkey";
ALTER TABLE "FireExtinguisher" ALTER COLUMN "siteId" DROP NOT NULL;
ALTER TABLE "FireExtinguisher" ADD CONSTRAINT "FireExtinguisher_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Maintenance: conditions noted during service
ALTER TABLE "MaintenanceRecord" ADD COLUMN "conditionsNoted" TEXT NOT NULL DEFAULT '';
