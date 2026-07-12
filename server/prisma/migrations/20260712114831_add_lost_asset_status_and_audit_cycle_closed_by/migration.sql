-- AlterEnum
ALTER TYPE "AssetStatus" ADD VALUE 'LOST';

-- AlterTable
ALTER TABLE "AuditCycle" ADD COLUMN     "closedById" TEXT;

-- AddForeignKey
ALTER TABLE "AuditCycle" ADD CONSTRAINT "AuditCycle_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
