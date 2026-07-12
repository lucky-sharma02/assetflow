import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { AssetQueryInput, RegisterAssetInput } from "../validation/asset";

const assetInclude = {
  category: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.AssetInclude;

const userSummary = { select: { id: true, name: true, email: true } };

// History relations are all empty until later issues add the
// endpoints that create them (#15 allocations, #16 transfers, #19/20
// bookings, #22 maintenance, #25-27 audits) — the plumbing is wired
// here so the detail page doesn't need to change again once they land.
const assetDetailInclude = {
  ...assetInclude,
  allocations: {
    orderBy: { allocatedAt: "desc" },
    include: { holder: userSummary, allocatedBy: userSummary },
  },
  transferRequests: {
    orderBy: { requestedAt: "desc" },
    include: { fromUser: userSummary, toUser: userSummary, requestedBy: userSummary },
  },
  bookings: {
    orderBy: { startTime: "desc" },
    include: { bookedBy: userSummary },
  },
  maintenanceRequests: {
    orderBy: { requestedAt: "desc" },
    include: { requestedBy: userSummary },
  },
  auditRecords: {
    orderBy: { verifiedAt: "desc" },
    include: { verifiedBy: userSummary, auditCycle: { select: { id: true, name: true } } },
  },
} satisfies Prisma.AssetInclude;

const TAG_PREFIX = "AF-";
const TAG_PAD_LENGTH = 5;

// Uses a Postgres sequence (asset_tag_seq, see prisma/migrations) rather
// than a MAX(assetTag)+1 read-then-write, so uniqueness holds under
// concurrent registrations without needing a transaction/lock.
async function generateAssetTag(): Promise<string> {
  const [{ nextval }] = await prisma.$queryRaw<
    { nextval: bigint }[]
  >`SELECT nextval('asset_tag_seq')`;
  return `${TAG_PREFIX}${nextval.toString().padStart(TAG_PAD_LENGTH, "0")}`;
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError("Asset category not found", 404);
  }
}

async function assertDepartmentExists(departmentId: string) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) {
    throw new AppError("Department not found", 404);
  }
}

export async function listAssets(filters: AssetQueryInput = {}) {
  const where: Prisma.AssetWhereInput = {
    categoryId: filters.categoryId,
    departmentId: filters.departmentId,
    status: filters.status,
    condition: filters.condition,
  };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { assetTag: { contains: filters.search, mode: "insensitive" } },
      { serialNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.asset.findMany({
    where,
    include: assetInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAssetById(id: string) {
  const asset = await prisma.asset.findUnique({ where: { id }, include: assetDetailInclude });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }
  return asset;
}

export async function registerAsset(input: RegisterAssetInput) {
  await assertCategoryExists(input.categoryId);
  if (input.departmentId) {
    await assertDepartmentExists(input.departmentId);
  }

  const assetTag = await generateAssetTag();

  return prisma.asset.create({
    data: {
      assetTag,
      name: input.name,
      categoryId: input.categoryId,
      departmentId: input.departmentId,
      condition: input.condition ?? "GOOD",
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate,
      purchaseCost: input.purchaseCost,
      location: input.location,
      notes: input.notes,
      // status is never taken from input — every asset starts AVAILABLE;
      // allocation (issue #15) is what moves it out of that state.
    },
    include: assetInclude,
  });
}
