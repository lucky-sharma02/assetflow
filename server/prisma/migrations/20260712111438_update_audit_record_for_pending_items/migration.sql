/*
  Warnings:

  - Added the required column `endDate` to the `AuditCycle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AuditRecord" DROP CONSTRAINT "AuditRecord_verifiedById_fkey";

-- AlterTable
ALTER TABLE "AuditCycle" ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AuditRecord" ALTER COLUMN "verifiedAt" DROP NOT NULL,
ALTER COLUMN "verifiedAt" DROP DEFAULT,
ALTER COLUMN "foundStatus" DROP NOT NULL,
ALTER COLUMN "foundCondition" DROP NOT NULL,
ALTER COLUMN "verifiedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
