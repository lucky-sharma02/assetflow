import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { AllocationQueryInput, CreateAllocationInput } from "../validation/allocation";

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

export async function listAllocations(filters: AllocationQueryInput = {}) {
  return prisma.allocation.findMany({
    where: {
      assetId: filters.assetId,
      holderId: filters.holderId,
      status: filters.status,
    },
    include: allocationInclude,
    orderBy: { allocatedAt: "desc" },
  });
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

  const [allocation] = await prisma.$transaction([
    prisma.allocation.create({
      data: {
        assetId: input.assetId,
        holderId: input.holderId,
        allocatedById,
        dueDate: input.dueDate,
        conditionAtAllocation: input.conditionAtAllocation ?? asset.condition,
        notes: input.notes,
      },
      include: allocationInclude,
    }),
    prisma.asset.update({
      where: { id: input.assetId },
      data: { status: "ALLOCATED" },
    }),
  ]);

  return allocation;
}
