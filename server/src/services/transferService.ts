import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateTransferInput, TransferQueryInput } from "../validation/transfer";

const userSummary = { select: { id: true, name: true, email: true } };

const transferInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true } },
  fromUser: userSummary,
  toUser: userSummary,
  requestedBy: userSummary,
  approvedBy: userSummary,
} satisfies Prisma.TransferRequestInclude;

async function assertUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
}

export async function listTransfers(filters: TransferQueryInput = {}) {
  return prisma.transferRequest.findMany({
    where: {
      assetId: filters.assetId,
      toUserId: filters.toUserId,
      fromUserId: filters.fromUserId,
      status: filters.status,
    },
    include: transferInclude,
    orderBy: { requestedAt: "desc" },
  });
}

// BR-007: a blocked allocation (asset already held by someone) can be
// turned into a transfer request instead. fromUser is derived from the
// asset's current ACTIVE allocation, not taken from the request body.
export async function createTransfer(input: CreateTransferInput, requestedById: string) {
  const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  const activeAllocation = await prisma.allocation.findFirst({
    where: { assetId: asset.id, status: "ACTIVE" },
  });
  if (!activeAllocation) {
    throw new AppError(
      "Asset is not currently allocated — allocate it directly instead of requesting a transfer",
      409
    );
  }

  if (activeAllocation.holderId === input.toUserId) {
    throw new AppError("This user already holds the asset", 400);
  }

  await assertUserExists(input.toUserId);

  return prisma.transferRequest.create({
    data: {
      assetId: input.assetId,
      fromUserId: activeAllocation.holderId,
      toUserId: input.toUserId,
      requestedById,
      reason: input.reason,
    },
    include: transferInclude,
  });
}

// BR-008: Requested -> Approved -> Reallocated. Approval and the
// reallocation it triggers happen as one atomic step: the outgoing
// holder's allocation is closed out, a new allocation is opened for
// the incoming holder, and the transfer is marked COMPLETED — matching
// the single transferService.approve() entry point named in the
// business rule catalog, rather than splitting "approve" from a
// separate "complete" action.
export async function approveTransfer(transferId: string, approvedById: string) {
  const transfer = await prisma.transferRequest.findUnique({ where: { id: transferId } });
  if (!transfer) {
    throw new AppError("Transfer request not found", 404);
  }
  if (transfer.status !== "REQUESTED") {
    throw new AppError(`Transfer request is already ${transfer.status.toLowerCase()}`, 409);
  }

  const activeAllocation = await prisma.allocation.findFirst({
    where: { assetId: transfer.assetId, status: "ACTIVE" },
  });
  if (!activeAllocation || activeAllocation.holderId !== transfer.fromUserId) {
    throw new AppError(
      "Asset's current holder no longer matches this transfer request — it may be stale",
      409
    );
  }

  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: transfer.assetId } });
  const now = new Date();

  const [, , updatedTransfer] = await prisma.$transaction([
    prisma.allocation.update({
      where: { id: activeAllocation.id },
      data: { status: "RETURNED", returnedAt: now },
    }),
    prisma.allocation.create({
      data: {
        assetId: transfer.assetId,
        holderId: transfer.toUserId,
        allocatedById: approvedById,
        conditionAtAllocation: asset.condition,
      },
    }),
    prisma.transferRequest.update({
      where: { id: transferId },
      data: {
        status: "COMPLETED",
        approvedById,
        approvedAt: now,
        completedAt: now,
      },
      include: transferInclude,
    }),
  ]);

  return updatedTransfer;
}

export async function rejectTransfer(transferId: string, approvedById: string) {
  const transfer = await prisma.transferRequest.findUnique({ where: { id: transferId } });
  if (!transfer) {
    throw new AppError("Transfer request not found", 404);
  }
  if (transfer.status !== "REQUESTED") {
    throw new AppError(`Transfer request is already ${transfer.status.toLowerCase()}`, 409);
  }

  return prisma.transferRequest.update({
    where: { id: transferId },
    data: { status: "REJECTED", approvedById, approvedAt: new Date() },
    include: transferInclude,
  });
}
