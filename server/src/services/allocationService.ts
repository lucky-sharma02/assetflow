import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { ActivityAction, record } from "./activityLogService";
import { NotificationType, notify } from "./notificationService";
import type {
  AllocationQueryInput,
  CreateAllocationInput,
  ReturnAllocationInput,
} from "../validation/allocation";

const userSummary = { select: { id: true, name: true, email: true } };

const allocationInclude = {
  asset: { select: { id: true, assetTag: true, name: true } },
  holder: userSummary,
  allocatedBy: userSummary,
} satisfies Prisma.AllocationInclude;

async function assertUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
}

// "Overdue" is a derived state, not a stored one -- AllocationStatus
// only has ACTIVE/RETURNED (see schema.prisma). An allocation is
// overdue if it's still ACTIVE and its dueDate has passed; allocations
// without a dueDate are never overdue.
function withOverdueFlag<T extends { status: string; dueDate: Date | null }>(allocation: T) {
  return {
    ...allocation,
    isOverdue:
      allocation.status === "ACTIVE" && allocation.dueDate !== null && allocation.dueDate < new Date(),
  };
}

export async function listAllocations(filters: AllocationQueryInput = {}) {
  const allocations = await prisma.allocation.findMany({
    where: {
      assetId: filters.assetId,
      holderId: filters.holderId,
      status: filters.status,
      ...(filters.overdue ? { status: "ACTIVE", dueDate: { lt: new Date() } } : {}),
    },
    include: allocationInclude,
    orderBy: { allocatedAt: "desc" },
  });

  return allocations.map(withOverdueFlag);
}

// BR-006: an asset that's already allocated cannot be re-allocated —
// block and surface the current holder so the caller (frontend) can
// offer a transfer request instead (BR-007, actually created in #16).
export async function allocateAsset(input: CreateAllocationInput, allocatedById: string) {
  const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  if (asset.status !== "AVAILABLE") {
    const activeAllocation = await prisma.allocation.findFirst({
      where: { assetId: asset.id, status: "ACTIVE" },
      include: allocationInclude,
    });

    throw new AppError(
      "Asset is already allocated",
      409,
      activeAllocation
        ? {
            allocationId: activeAllocation.id,
            holder: activeAllocation.holder,
            allocatedAt: activeAllocation.allocatedAt,
            dueDate: activeAllocation.dueDate,
          }
        : { assetStatus: asset.status }
    );
  }

  await assertUserExists(input.holderId);

  // Converted from array-form $transaction to callback-form (#29) so the
  // "asset assigned" notification can be created with the transaction's own
  // tx client -- array-form $transaction can't accept a dynamically-built
  // query like that, only pre-built PrismaPromises against the top-level
  // client.
  const allocation = await prisma.$transaction(async (tx) => {
    const created = await tx.allocation.create({
      data: {
        assetId: input.assetId,
        holderId: input.holderId,
        allocatedById,
        dueDate: input.dueDate,
        conditionAtAllocation: input.conditionAtAllocation ?? asset.condition,
        notes: input.notes,
      },
      include: allocationInclude,
    });

    await tx.asset.update({
      where: { id: input.assetId },
      data: { status: "ALLOCATED" },
    });

    await notify(
      input.holderId,
      {
        type: NotificationType.ASSET_ASSIGNED,
        title: "Asset assigned to you",
        message: `${asset.name} (${asset.assetTag}) has been assigned to you.`,
        relatedEntityType: "Asset",
        relatedEntityId: asset.id,
      },
      tx
    );

    // entityType "Asset" (not "Allocation") per #30's convention: this is a
    // per-asset lifecycle event, and "Asset" is the join point a future
    // asset-detail activity feed would filter on. allocationId is still
    // captured in metadata for traceability.
    await record(
      allocatedById,
      {
        action: ActivityAction.ASSET_ALLOCATED,
        entityType: "Asset",
        entityId: asset.id,
        metadata: { allocationId: created.id, holderId: input.holderId },
      },
      tx
    );

    return created;
  });

  return withOverdueFlag(allocation);
}

// Asset return + condition check-in: closes out the ACTIVE allocation,
// records the condition the asset was actually returned in, and syncs
// the asset back to AVAILABLE with that condition as its new current
// condition. Deliberately does not auto-route to UNDER_MAINTENANCE even
// if the returned condition is POOR/DAMAGED -- maintenance requests are
// their own explicit workflow (#22-24), not an automatic side effect.
export async function returnAllocation(allocationId: string, input: ReturnAllocationInput) {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId } });
  if (!allocation) {
    throw new AppError("Allocation not found", 404);
  }
  if (allocation.status !== "ACTIVE") {
    throw new AppError("Allocation has already been returned", 409);
  }

  const now = new Date();

  const [updatedAllocation] = await prisma.$transaction([
    prisma.allocation.update({
      where: { id: allocationId },
      data: {
        status: "RETURNED",
        returnedAt: now,
        conditionAtReturn: input.conditionAtReturn,
        notes: input.notes ?? allocation.notes,
      },
      include: allocationInclude,
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: "AVAILABLE", condition: input.conditionAtReturn },
    }),
  ]);

  return withOverdueFlag(updatedAllocation);
}
