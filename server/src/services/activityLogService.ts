import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type QueryClient = PrismaClient | Prisma.TransactionClient;

// ACTION-NAMING CONVENTION (#30): SCREAMING_SNAKE_CASE, shaped
// <SUBJECT>_<VERB_PAST_TENSE> (e.g. ASSET_ALLOCATED, not ALLOCATE_ASSET or
// "allocated") -- mirrors the plain-string-literal-object pattern
// notificationService.ts's NotificationType already established in #29
// (ActivityLog.action is a plain String column, not a Prisma enum, same as
// Notification.type). Future issues that add more logged actions should
// extend this object rather than hand-typing new strings elsewhere.
export const ActivityAction = {
  ASSET_ALLOCATED: "ASSET_ALLOCATED",
  TRANSFER_APPROVED: "TRANSFER_APPROVED",
  MAINTENANCE_APPROVED: "MAINTENANCE_APPROVED",
  MAINTENANCE_REJECTED: "MAINTENANCE_REJECTED",
  MAINTENANCE_RESOLVED: "MAINTENANCE_RESOLVED",
  AUDIT_CYCLE_CREATED: "AUDIT_CYCLE_CREATED",
  AUDIT_CYCLE_CLOSED: "AUDIT_CYCLE_CLOSED",
} as const;

// ENTITY-TYPE CONVENTION (#30): "Asset" for any action about a single
// physical asset's lifecycle (allocation, transfer, maintenance) -- this is
// the join point a future asset-detail "activity for this asset" view would
// filter on, same reasoning notificationService.ts used for
// relatedEntityType. "AuditCycle" is used instead for audit actions, since
// an audit cycle spans many assets at once and isn't itself scoped to one.
export interface RecordParams {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

// The single shared activity-log-creation path, mirroring
// notificationService.ts's notify() from #29: every service that needs to
// log an action should call this instead of prisma.activityLog.create()
// directly. Accepts an optional transaction client so the log entry can be
// created atomically with the state change it's recording, same
// QueryClient pattern used throughout (bookingService.checkOverlap, #20).
// userId is nullable per the schema -- system-triggered actions with no
// specific human actor are a real, intended case, not an oversight.
export async function record(
  userId: string | null,
  params: RecordParams,
  client: QueryClient = prisma
) {
  return client.activityLog.create({
    data: {
      userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export interface ListLogsFilters {
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

// Simple take/skip pagination, not cursor-based -- no other list endpoint
// in this codebase paginates at all yet (everything else just returns the
// full set), so cursor pagination would be new complexity this issue
// doesn't need. Always capped at MAX_LIMIT even if a caller asks for more,
// so this can never return an unbounded result set as the log grows.
export async function listLogs(filters: ListLogsFilters = {}) {
  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  return prisma.activityLog.findMany({
    where: {
      entityType: filters.entityType,
      entityId: filters.entityId,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: filters.offset ?? 0,
  });
}
