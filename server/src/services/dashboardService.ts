import { prisma } from "../lib/prisma";

// LOST was missing here (see validation/asset.ts's #34 fix note for the
// full story) -- caused a real, visible bug: assets.byStatus silently
// dropped LOST rows while assets.total (computed separately via
// groupBy()'s own row count) still included them, so the breakdown summed
// to less than the total on the dashboard.
const ASSET_STATUSES = ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED", "LOST"] as const;

export async function getDashboardSummary() {
  const now = new Date();

  const [
    assetsByStatus,
    activeAllocations,
    overdueAllocations,
    pendingTransfers,
    pendingMaintenance,
    upcomingBookings,
  ] = await Promise.all([
    prisma.asset.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.allocation.count({ where: { status: "ACTIVE" } }),
    prisma.allocation.count({ where: { status: "ACTIVE", dueDate: { lt: now } } }),
    prisma.transferRequest.count({ where: { status: "REQUESTED" } }),
    prisma.maintenanceRequest.count({
      where: { status: { in: ["REQUESTED", "APPROVED", "IN_PROGRESS"] } },
    }),
    prisma.booking.count({ where: { status: "CONFIRMED", startTime: { gt: now } } }),
  ]);

  const countByStatus = Object.fromEntries(
    assetsByStatus.map((row) => [row.status, row._count._all])
  );

  const assets = {
    total: assetsByStatus.reduce((sum, row) => sum + row._count._all, 0),
    byStatus: ASSET_STATUSES.map((status) => ({
      status,
      count: countByStatus[status] ?? 0,
    })),
  };

  return {
    assets,
    allocations: { active: activeAllocations, overdue: overdueAllocations },
    transfers: { pending: pendingTransfers },
    maintenance: { pending: pendingMaintenance },
    bookings: { upcoming: upcomingBookings },
  };
}
