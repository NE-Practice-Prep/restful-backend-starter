-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- AlterTable
ALTER TABLE "FireExtinguisher" ADD COLUMN     "assignedToId" TEXT;

-- CreateTable
CREATE TABLE "ExtinguisherRequest" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "extinguisherId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "type" "ExtinguisherType",
    "size" "ExtinguisherSize",
    "notes" TEXT NOT NULL DEFAULT '',
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtinguisherRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtinguisherRequest_requestedById_createdAt_idx" ON "ExtinguisherRequest"("requestedById", "createdAt");

-- CreateIndex
CREATE INDEX "ExtinguisherRequest_status_idx" ON "ExtinguisherRequest"("status");

-- CreateIndex
CREATE INDEX "ExtinguisherRequest_extinguisherId_idx" ON "ExtinguisherRequest"("extinguisherId");

-- CreateIndex
CREATE INDEX "FireExtinguisher_assignedToId_idx" ON "FireExtinguisher"("assignedToId");

-- AddForeignKey
ALTER TABLE "FireExtinguisher" ADD CONSTRAINT "FireExtinguisher_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtinguisherRequest" ADD CONSTRAINT "ExtinguisherRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtinguisherRequest" ADD CONSTRAINT "ExtinguisherRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtinguisherRequest" ADD CONSTRAINT "ExtinguisherRequest_extinguisherId_fkey" FOREIGN KEY ("extinguisherId") REFERENCES "FireExtinguisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
