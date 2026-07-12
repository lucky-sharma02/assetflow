import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { AssetQueryInput, RegisterAssetInput } from "../validation/asset";

const assetInclude = {
  category: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.AssetInclude;

const userSummary = { select: { id: true, name: true, email: true } };

// History relations were wired up empty in #14, ahead of the endpoints
// that create the data (#15 allocations, #16 transfers, #19/20 bookings,
// #22/23 maintenance) — each landed with zero changes needed here.
// #25-27 (audits) are the only relation still pending real data.
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
    include: { requestedBy: userSummary, approvedBy: userSummary },
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
    isBookable: filters.isBookable,
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

// Flat, human-readable shape for CSV export -- relations resolved to
// their display names (category/department name), not raw ids, since
// this is meant to be opened in a spreadsheet.
export async function listAssetsForExport() {
  const assets = await listAssets();
  return assets.map((asset) => ({
    assetTag: asset.assetTag,
    name: asset.name,
    category: asset.category.name,
    department: asset.department?.name ?? "",
    status: asset.status,
    condition: asset.condition,
    location: asset.location ?? "",
    serialNumber: asset.serialNumber ?? "",
    isBookable: asset.isBookable ? "Yes" : "No",
  }));
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
      // Opt-in, not retroactive: assets are non-bookable by default (#19) —
      // an Admin/Asset Manager must explicitly flag a resource as bookable.
      isBookable: input.isBookable ?? false,
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
