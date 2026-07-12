import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateBookingInput } from "../validation/booking";

const bookedBySummary = { select: { id: true, name: true, email: true } };

// The Postgres EXCLUDE constraint `booking_no_overlap` (added in #5) is the
// source of truth for overlap rejection — it uses tsrange(startTime, endTime)
// with the default [) bounds, so back-to-back bookings (one's end == the
// next's start) do not overlap and are allowed per BR-012. This function
// does not re-check overlap in JS; it only translates the resulting
// Postgres error into a clean 409. Issue #20 is expected to add
// application-layer overlap checks on top of this (e.g. a pre-check that
// can name the conflicting booking in the error message).
function rethrowKnownPrismaErrors(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      throw new AppError("Asset not found", 404);
    }
  }
  if (
    err instanceof Prisma.PrismaClientUnknownRequestError &&
    err.message.includes("booking_no_overlap")
  ) {
    throw new AppError("This asset is already booked for the requested time", 409);
  }
  throw err;
}

async function assertAssetIsBookable(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }
  if (!asset.isBookable) {
    throw new AppError("This asset is not available for booking", 400);
  }
}

export async function listBookingsForAsset(assetId: string) {
  return prisma.booking.findMany({
    where: { assetId },
    include: { bookedBy: bookedBySummary },
    orderBy: { startTime: "asc" },
  });
}

export async function createBooking(bookedById: string, input: CreateBookingInput) {
  await assertAssetIsBookable(input.assetId);

  try {
    return await prisma.booking.create({
      data: {
        assetId: input.assetId,
        bookedById,
        startTime: input.startTime,
        endTime: input.endTime,
        purpose: input.purpose,
      },
      include: { bookedBy: bookedBySummary },
    });
  } catch (err) {
    rethrowKnownPrismaErrors(err);
  }
}
