import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateAuditCycleInput } from "../validation/audit";

const userSummary = { select: { id: true, name: true, email: true } };
const departmentSummary = { select: { id: true, name: true } };

const cycleInclude = {
  createdBy: userSummary,
  department: departmentSummary,
  _count: { select: { assignments: true, records: true } },
} satisfies Prisma.AuditCycleInclude;

async function assertDepartmentExists(departmentId: string) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) {
    throw new AppError("Department not found", 404);
  }
}

async function assertAuditorsExist(auditorIds: string[]) {
  const auditors = await prisma.user.findMany({
    where: { id: { in: auditorIds } },
    select: { id: true },
  });
  const foundIds = new Set(auditors.map((u) => u.id));
  const missingIds = auditorIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new AppError("One or more auditors were not found", 404, { missingIds });
  }
}

export async function listCycles() {
  return prisma.auditCycle.findMany({
    include: cycleInclude,
    orderBy: { createdAt: "desc" },
  });
}

// Scope: AuditCycle.departmentId already covers this -- null audits every
// asset org-wide, a set departmentId scopes to just that department's
// assets. No separate "scope" field is needed.
//
// Audit items are generated PENDING here (verifiedAt/foundStatus/
// foundCondition/verifiedById all left unset) -- #26's verification
// endpoint is what fills them in on an existing row, it does not create
// new AuditRecord rows.
export async function createCycle(createdById: string, input: CreateAuditCycleInput) {
  if (input.departmentId) {
    await assertDepartmentExists(input.departmentId);
  }
  await assertAuditorsExist(input.auditorIds);

  const inScopeAssets = await prisma.asset.findMany({
    where: input.departmentId ? { departmentId: input.departmentId } : {},
    select: { id: true },
  });

  return prisma.$transaction(async (tx) => {
    const cycle = await tx.auditCycle.create({
      data: {
        name: input.name,
        departmentId: input.departmentId,
        startDate: input.startDate,
        endDate: input.endDate,
        createdById,
      },
    });

    await tx.auditAssignment.createMany({
      data: input.auditorIds.map((auditorId) => ({
        auditCycleId: cycle.id,
        auditorId,
      })),
    });

    if (inScopeAssets.length > 0) {
      await tx.auditRecord.createMany({
        data: inScopeAssets.map((asset) => ({
          auditCycleId: cycle.id,
          assetId: asset.id,
        })),
      });
    }

    // Re-fetch with the include (rather than reusing the plain create()
    // result) so the returned _count reflects the assignments/records
    // just created above -- create()'s own _count would be computed
    // before those rows existed and always read back as zero.
    return tx.auditCycle.findUniqueOrThrow({
      where: { id: cycle.id },
      include: cycleInclude,
    });
  });
}
