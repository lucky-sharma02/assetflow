import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateMaintenanceRequestInput } from "../validation/maintenance";

const requestedBySummary = { select: { id: true, name: true, email: true } };

async function assertAssetExists(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }
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
