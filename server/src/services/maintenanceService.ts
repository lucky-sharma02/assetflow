import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { ActivityAction, record } from "./activityLogService";
import { NotificationType, notify } from "./notificationService";
import type {
  CreateMaintenanceRequestInput,
  RejectMaintenanceRequestInput,
} from "../validation/maintenance";

const requestedBySummary = { select: { id: true, name: true, email: true } };

async function assertAssetExists(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }
}

async function getRequestedMaintenanceRequest(id: string) {
  const maintenanceRequest = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!maintenanceRequest) {
    throw new AppError("Maintenance request not found", 404);
  }
  if (maintenanceRequest.status !== "REQUESTED") {
    throw new AppError("Maintenance request has already been processed", 409);
  }
  return maintenanceRequest;
}

export async function raise(
  requestedById: string,
  input: CreateMaintenanceRequestInput,
  photoUrl?: string
) {
  await assertAssetExists(input.assetId);

  return prisma.maintenanceRequest.create({
    data: {
      assetId: input.assetId,
      requestedById,
      issueDescription: input.issueDescription,
      photoUrl,
      status: "REQUESTED",
    },
    include: { requestedBy: requestedBySummary },
  });
}

// BR-015: the asset's status stays untouched at creation time (raise() above
// never touches Asset) and only flips to UNDER_MAINTENANCE here, on approval
// -- gating the repair on an explicit Asset Manager decision rather than
// treating a raw request as authoritative.
export async function approve(maintenanceRequestId: string, approvedById: string) {
  const maintenanceRequest = await getRequestedMaintenanceRequest(maintenanceRequestId);
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: maintenanceRequest.assetId } });

  // Converted from array-form to callback-form $transaction (#29), same
  // reasoning as allocationService.allocateAsset -- notify() needs the tx
  // client to be atomic with the status writes.
  const [updated] = await prisma.$transaction(async (tx) => {
    const result = await Promise.all([
      tx.maintenanceRequest.update({
        where: { id: maintenanceRequestId },
        data: { status: "APPROVED", approvedAt: new Date(), approvedById },
        include: { requestedBy: requestedBySummary },
      }),
      tx.asset.update({
        where: { id: maintenanceRequest.assetId },
        data: { status: "UNDER_MAINTENANCE" },
      }),
    ]);

    await notify(
      maintenanceRequest.requestedById,
      {
        type: NotificationType.MAINTENANCE_APPROVED,
        title: "Maintenance request approved",
        message: `Your maintenance request for ${asset.name} (${asset.assetTag}) was approved.`,
        relatedEntityType: "MaintenanceRequest",
        relatedEntityId: maintenanceRequestId,
      },
      tx
    );

    await record(
      approvedById,
      {
        action: ActivityAction.MAINTENANCE_APPROVED,
        entityType: "Asset",
        entityId: maintenanceRequest.assetId,
        metadata: {
          requestId: maintenanceRequestId,
          previousStatus: "REQUESTED",
          newStatus: "APPROVED",
        },
      },
      tx
    );

    return result;
  });

  return updated;
}

// Rejecting never touches Asset status -- the asset was never taken
// UNDER_MAINTENANCE, since it was never approved. approvedAt/approvedById
// are reused here (rather than adding separate rejectedAt/rejectedById
// columns) to record who processed the request and when, for both outcomes.
export async function reject(
  maintenanceRequestId: string,
  approvedById: string,
  input: RejectMaintenanceRequestInput
) {
  const maintenanceRequest = await getRequestedMaintenanceRequest(maintenanceRequestId);
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: maintenanceRequest.assetId } });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id: maintenanceRequestId },
      data: {
        status: "REJECTED",
        approvedAt: new Date(),
        approvedById,
        notes: input.notes ?? maintenanceRequest.notes,
      },
      include: { requestedBy: requestedBySummary },
    });

    await notify(
      maintenanceRequest.requestedById,
      {
        type: NotificationType.MAINTENANCE_REJECTED,
        title: "Maintenance request rejected",
        message: `Your maintenance request for ${asset.name} (${asset.assetTag}) was rejected.${
          input.notes ? ` Reason: ${input.notes}` : ""
        }`,
        relatedEntityType: "MaintenanceRequest",
        relatedEntityId: maintenanceRequestId,
      },
      tx
    );

    await record(
      approvedById,
      {
        action: ActivityAction.MAINTENANCE_REJECTED,
        entityType: "Asset",
        entityId: maintenanceRequest.assetId,
        metadata: {
          requestId: maintenanceRequestId,
          previousStatus: "REQUESTED",
          newStatus: "REJECTED",
        },
      },
      tx
    );

    return updated;
  });
}

// Resolves directly from APPROVED -- the acceptance criteria only names a
// REQUESTED -> APPROVED -> RESOLVED path with no explicit IN_PROGRESS step,
// so this doesn't force one. (IN_PROGRESS remains a valid enum value for a
// future issue to use if a distinct "work started" transition is needed.)
// resolvedById (#30) is only used for the activity log's actor -- there's
// no resolvedById column on MaintenanceRequest itself (only approvedById,
// reused for both approve/reject per #23's design); this doesn't change
// that, it just threads the caller's id through far enough to log who
// resolved it. Converted from array-form to callback-form $transaction
// (#29/#30's established pattern) so record() can run atomically with the
// status writes.
export async function resolve(maintenanceRequestId: string, resolvedById: string) {
  const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
    where: { id: maintenanceRequestId },
  });
  if (!maintenanceRequest) {
    throw new AppError("Maintenance request not found", 404);
  }
  if (maintenanceRequest.status !== "APPROVED") {
    throw new AppError("Only an approved maintenance request can be resolved", 409);
  }

  const [updated] = await prisma.$transaction(async (tx) => {
    const result = await Promise.all([
      tx.maintenanceRequest.update({
        where: { id: maintenanceRequestId },
        data: { status: "RESOLVED", resolvedAt: new Date() },
        include: { requestedBy: requestedBySummary },
      }),
      tx.asset.update({
        where: { id: maintenanceRequest.assetId },
        data: { status: "AVAILABLE" },
      }),
    ]);

    await record(
      resolvedById,
      {
        action: ActivityAction.MAINTENANCE_RESOLVED,
        entityType: "Asset",
        entityId: maintenanceRequest.assetId,
        metadata: {
          requestId: maintenanceRequestId,
          previousStatus: "APPROVED",
          newStatus: "RESOLVED",
        },
      },
      tx
    );

    return result;
  });

  return updated;
}
