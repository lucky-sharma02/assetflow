import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateBookingInput } from "../validation/booking";

const bookedBySummary = { select: { id: true, name: true, email: true } };

type QueryClient = PrismaClient | Prisma.TransactionClient;

// The Postgres EXCLUDE constraint `booking_no_overlap` (added in #5) remains
// as a database-level safety net for races this app-layer check might miss,
// but is no longer the primary overlap-rejection path — checkOverlap() below
// is. If it's ever hit anyway, translate it into the same clean 409 rather
// than letting the raw constraint-violation error leak out.
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

async function assertAssetIsBookable(client: QueryClient, assetId: string) {
  const asset = await client.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }
  if (!asset.isBookable) {
    throw new AppError("This asset is not available for booking", 400);
  }
}

// Mirrors the boundary semantics of the `booking_no_overlap` EXCLUDE
// constraint exactly: tsrange(startTime, endTime) defaults to `[)` bounds,
// so two ranges overlap iff existing.start < requested.end AND
// existing.end > requested.start (strict inequality on both sides — a
// back-to-back booking, where one's end equals the next's start, does NOT
// count as overlapping, per BR-012). `excludeBookingId` is unused today but
// is threaded through now so #21's reschedule flow can exclude the booking
// being moved from conflicting with itself, without changing this
// function's signature later.
export async function checkOverlap(
  assetId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string,
  client: QueryClient = prisma
) {
  const conflict = await client.booking.findFirst({
    where: {
      assetId,
      status: "CONFIRMED",
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflict) {
    throw new AppError("This asset is already booked for the requested time", 409);
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
  try {
    // Check + insert run inside one transaction so a concurrent request
    // can't slip a conflicting booking in between the check and the write.
    // The Postgres EXCLUDE constraint is the final backstop if even that
    // isn't enough (e.g. isolation-level edge cases).
    return await prisma.$transaction(async (tx) => {
      await assertAssetIsBookable(tx, input.assetId);
      await checkOverlap(input.assetId, input.startTime, input.endTime, undefined, tx);

      return tx.booking.create({
        data: {
          assetId: input.assetId,
          bookedById,
          startTime: input.startTime,
          endTime: input.endTime,
          purpose: input.purpose,
        },
        include: { bookedBy: bookedBySummary },
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowKnownPrismaErrors(err);
  }
}
