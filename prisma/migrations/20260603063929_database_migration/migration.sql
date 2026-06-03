/*
  Warnings:

  - The values [editor,viewer] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ExtinguisherStatus" AS ENUM ('in_service', 'needs_inspection', 'needs_maintenance', 'out_of_service', 'decommissioned');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('pass', 'fail', 'conditional', 'pending');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('inspection_followup', 'refill', 'recharge', 'repair', 'replacement', 'hydrostatic_test', 'annual_service', 'other');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('compliant', 'non_compliant', 'expiring_soon', 'unknown');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('extinguisher_inventory', 'inspection_summary', 'maintenance_log', 'compliance_overview', 'custom');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'generating', 'ready', 'failed');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'inspector', 'user');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireExtinguisher" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT,
    "extinguisherClass" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "capacityKg" DECIMAL(8,2),
    "siteId" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "mountingLocation" TEXT,
    "status" "ExtinguisherStatus" NOT NULL DEFAULT 'in_service',
    "complianceStatus" "ComplianceStatus" NOT NULL DEFAULT 'unknown',
    "manufacturedAt" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3),
    "lastInspectionAt" TIMESTAMP(3),
    "nextInspectionDue" TIMESTAMP(3),
    "lastMaintenanceAt" TIMESTAMP(3),
    "nextMaintenanceDue" TIMESTAMP(3),
    "pressurePsi" DECIMAL(6,2),
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FireExtinguisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "extinguisherId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "requestedById" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "InspectionStatus" NOT NULL DEFAULT 'scheduled',
    "result" "InspectionResult" NOT NULL DEFAULT 'pending',
    "pressureOk" BOOLEAN,
    "sealIntact" BOOLEAN,
    "gaugeReadable" BOOLEAN,
    "accessible" BOOLEAN,
    "findings" TEXT NOT NULL DEFAULT '',
    "correctiveAction" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "extinguisherId" TEXT NOT NULL,
    "inspectionId" TEXT,
    "performedById" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueAt" TIMESTAMP(3),
    "partsReplaced" TEXT NOT NULL DEFAULT '',
    "cost" DECIMAL(10,2),
    "statusAfter" "ExtinguisherStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "extinguisherId" TEXT NOT NULL,
    "checkedById" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL,
    "regulationRef" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "dueAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "generatedById" TEXT NOT NULL,
    "fileUrl" TEXT,
    "rowCount" INTEGER,
    "errorMessage" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE INDEX "Site_isActive_idx" ON "Site"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FireExtinguisher_assetTag_key" ON "FireExtinguisher"("assetTag");

-- CreateIndex
CREATE INDEX "FireExtinguisher_siteId_status_idx" ON "FireExtinguisher"("siteId", "status");

-- CreateIndex
CREATE INDEX "FireExtinguisher_complianceStatus_idx" ON "FireExtinguisher"("complianceStatus");

-- CreateIndex
CREATE INDEX "FireExtinguisher_nextInspectionDue_idx" ON "FireExtinguisher"("nextInspectionDue");

-- CreateIndex
CREATE INDEX "FireExtinguisher_status_idx" ON "FireExtinguisher"("status");

-- CreateIndex
CREATE INDEX "Inspection_extinguisherId_scheduledAt_idx" ON "Inspection"("extinguisherId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Inspection_inspectorId_status_idx" ON "Inspection"("inspectorId", "status");

-- CreateIndex
CREATE INDEX "Inspection_status_scheduledAt_idx" ON "Inspection"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_extinguisherId_performedAt_idx" ON "MaintenanceRecord"("extinguisherId", "performedAt");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_performedById_idx" ON "MaintenanceRecord"("performedById");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_type_idx" ON "MaintenanceRecord"("type");

-- CreateIndex
CREATE INDEX "ComplianceRecord_extinguisherId_checkedAt_idx" ON "ComplianceRecord"("extinguisherId", "checkedAt");

-- CreateIndex
CREATE INDEX "ComplianceRecord_status_idx" ON "ComplianceRecord"("status");

-- CreateIndex
CREATE INDEX "Report_generatedById_requestedAt_idx" ON "Report"("generatedById", "requestedAt");

-- CreateIndex
CREATE INDEX "Report_type_status_idx" ON "Report"("type", "status");

-- AddForeignKey
ALTER TABLE "FireExtinguisher" ADD CONSTRAINT "FireExtinguisher_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_extinguisherId_fkey" FOREIGN KEY ("extinguisherId") REFERENCES "FireExtinguisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_extinguisherId_fkey" FOREIGN KEY ("extinguisherId") REFERENCES "FireExtinguisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_extinguisherId_fkey" FOREIGN KEY ("extinguisherId") REFERENCES "FireExtinguisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
