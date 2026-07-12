import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type {
  CloseCycleInput,
  CreateAuditCycleInput,
  RecordAuditResultInput,
} from "../validation/audit";

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

export async function listPendingItemsForAuditor(auditorId: string) {
  return prisma.auditRecord.findMany({
    where: {
      verifiedAt: null,
      auditCycle: { assignments: { some: { auditorId } } },
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true, condition: true } },
      auditCycle: { select: { id: true, name: true, endDate: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

// Ownership-based authorization, not role-based: any authenticated user
// can call this route (see routes/audits.ts), and it's this function --
// not requireRole -- that decides whether the request is allowed, by
// checking for a real AuditAssignment row linking verifiedById to THIS
// specific auditCycleId. Being an auditor on some other cycle, or being
// Admin, is not sufficient -- the acceptance criteria names no Admin
// override, so none is added.
export async function recordResult(
  auditCycleId: string,
  itemId: string,
  verifiedById: string,
  input: RecordAuditResultInput
) {
  const record = await prisma.auditRecord.findUnique({
    where: { id: itemId },
    include: {
      asset: { select: { status: true, condition: true } },
      auditCycle: { select: { status: true } },
    },
  });

  if (!record || record.auditCycleId !== auditCycleId) {
    throw new AppError("Audit item not found", 404);
  }

  // A closed cycle rejects all further item edits (#27) -- even an item
  // that's still technically pending simply stays unverified/incomplete
  // once its cycle is closed, rather than being editable after the fact.
  if (record.auditCycle.status === "CLOSED") {
    throw new AppError("This audit cycle is closed", 409);
  }

  // Verifying is a one-shot action -- an already-verified item is not
  // silently overwritten. If a correction is genuinely needed later,
  // that's a distinct "amend a verified record" feature, not implied by
  // this issue's acceptance criteria.
  if (record.verifiedAt) {
    throw new AppError("This audit item has already been verified", 409);
  }

  const assignment = await prisma.auditAssignment.findFirst({
    where: { auditCycleId, auditorId: verifiedById },
  });
  if (!assignment) {
    throw new AppError("You are not assigned to this audit cycle", 403);
  }

  // Server-derived, not client-supplied: a client can't be trusted to
  // self-report whether its own finding is a discrepancy. Compares the
  // submitted foundStatus/foundCondition against the asset's actual
  // current status/condition at verification time.
  const isDiscrepant =
    input.foundStatus !== record.asset.status || input.foundCondition !== record.asset.condition;

  return prisma.auditRecord.update({
    where: { id: itemId },
    data: {
      foundStatus: input.foundStatus,
      foundCondition: input.foundCondition,
      verifiedById,
      verifiedAt: new Date(),
      isDiscrepant,
      discrepancyNotes: input.discrepancyNotes,
    },
    include: {
      verifiedBy: userSummary,
      asset: { select: { id: true, assetTag: true, name: true } },
    },
  });
}

async function assertCycleExists(auditCycleId: string) {
  const cycle = await prisma.auditCycle.findUnique({ where: { id: auditCycleId } });
  if (!cycle) {
    throw new AppError("Audit cycle not found", 404);
  }
  return cycle;
}

async function assertAssetsExist(assetIds: string[]) {
  const assets = await prisma.asset.findMany({
    where: { id: { in: assetIds } },
    select: { id: true },
  });
  const foundIds = new Set(assets.map((a) => a.id));
  const missingIds = assetIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new AppError("One or more lost assets were not found", 404, { missingIds });
  }
}

export async function generateDiscrepancyReport(auditCycleId: string) {
  await assertCycleExists(auditCycleId);

  return prisma.auditRecord.findMany({
    where: { auditCycleId, isDiscrepant: true },
    include: {
      asset: {
        select: { id: true, assetTag: true, name: true, status: true, condition: true },
      },
      verifiedBy: userSummary,
    },
    orderBy: { verifiedAt: "asc" },
  });
}

// "Confirmed missing" is a MANUAL determination, not auto-derived from
// isDiscrepant alone. The current data model has no field distinguishing
// "found but in worse condition than expected" (discrepant, not missing)
// from "could not be located at all" (discrepant AND missing) -- both are
// just isDiscrepant: true with free-text discrepancyNotes, and #26's
// foundStatus is typed as AssetStatus (what was physically observed), not
// a place to record "not observed at all". Auto-inferring "missing" from
// discrepancyNotes text would mean regex-guessing a free-text field, which
// is fragile. Instead, the Admin/Asset Manager closing the cycle reviews
// generateDiscrepancyReport() themselves and explicitly names which
// assetIds are confirmed missing via lostAssetIds.
export async function closeCycle(
  auditCycleId: string,
  closedById: string,
  input: CloseCycleInput
) {
  const cycle = await assertCycleExists(auditCycleId);

  if (cycle.status === "CLOSED") {
    throw new AppError("This audit cycle is already closed", 409);
  }

  const lostAssetIds = input.lostAssetIds ?? [];
  if (lostAssetIds.length > 0) {
    await assertAssetsExist(lostAssetIds);
  }

  return prisma.$transaction(async (tx) => {
    if (lostAssetIds.length > 0) {
      await tx.asset.updateMany({
        where: { id: { in: lostAssetIds } },
        data: { status: "LOST" },
      });
    }

    return tx.auditCycle.update({
      where: { id: auditCycleId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedById,
      },
      include: cycleInclude,
    });
  });
}
