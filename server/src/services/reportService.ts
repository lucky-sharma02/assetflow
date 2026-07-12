import { prisma } from "../lib/prisma";

const ASSET_STATUSES = ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED", "LOST"] as const;

// Current-snapshot breakdown, not a historical trend -- sufficient to
// satisfy "renders live data" without needing to reconstruct status
// history from Allocation/MaintenanceRequest/AuditRecord timestamps.
export async function getAssetUtilizationReport() {
  const grouped = await prisma.asset.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const countByStatus = Object.fromEntries(grouped.map((row) => [row.status, row._count._all]));
  const total = grouped.reduce((sum, row) => sum + row._count._all, 0);

  return {
    total,
    byStatus: ASSET_STATUSES.map((status) => {
      const count = countByStatus[status] ?? 0;
      return {
        status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    }),
  };
}

// Top N assets by maintenance request count -- ranks the assets that
// actually consume the most maintenance attention. Sorted/sliced in JS
// rather than via a Prisma groupBy `orderBy` on the aggregate, since the
// result set (one row per asset with any maintenance history) is small
// and this keeps the query itself simple.
export async function getMaintenanceFrequencyReport(limit = 10) {
  const grouped = await prisma.maintenanceRequest.groupBy({
    by: ["assetId"],
    _count: { _all: true },
  });

  const top = grouped.sort((a, b) => b._count._all - a._count._all).slice(0, limit);

  const assets = await prisma.asset.findMany({
    where: { id: { in: top.map((row) => row.assetId) } },
    select: { id: true, name: true, assetTag: true },
  });
  const assetById = new Map(assets.map((a) => [a.id, a]));

  return top.map((row) => {
    const asset = assetById.get(row.assetId);
    return {
      assetId: row.assetId,
      assetName: asset?.name ?? "Unknown asset",
      assetTag: asset?.assetTag ?? "",
      requestCount: row._count._all,
    };
  });
}

// Percentage of each department's assets that are currently allocated.
// Fetched via the Asset relation + reduced in JS rather than a groupBy,
// since grouping "by department, filtered to one status, as a fraction
// of that department's total" isn't a single clean Prisma aggregate.
export async function getDepartmentAllocationReport() {
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
      assets: { select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  return departments.map((department) => {
    const totalAssets = department.assets.length;
    const allocatedAssets = department.assets.filter((a) => a.status === "ALLOCATED").length;
    return {
      departmentId: department.id,
      departmentName: department.name,
      totalAssets,
      allocatedAssets,
      percentage: totalAssets > 0 ? Math.round((allocatedAssets / totalAssets) * 1000) / 10 : 0,
    };
  });
}
