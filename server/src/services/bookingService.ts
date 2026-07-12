import { Prisma, PrismaClient, type Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { NotificationType, notify, notifyReplacingUnread } from "./notificationService";
import type { CreateBookingInput, RescheduleBookingInput } from "../validation/booking";

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
    // isn't enough (e.g. isolation-level edge cases). The "booking
    // confirmed" notification is created in the same transaction (#29) so
    // it's atomic with the booking itself -- unlike the reminder below,
    // this one is core to the booking existing at all.
    const booking = await prisma.$transaction(async (tx) => {
      await assertAssetIsBookable(tx, input.assetId);
      await checkOverlap(input.assetId, input.startTime, input.endTime, undefined, tx);

      const created = await tx.booking.create({
        data: {
          assetId: input.assetId,
          bookedById,
          startTime: input.startTime,
          endTime: input.endTime,
          purpose: input.purpose,
        },
        include: { bookedBy: bookedBySummary },
      });

      const asset = await tx.asset.findUnique({ where: { id: created.assetId }, select: { name: true } });
      await notify(
        bookedById,
        {
          type: NotificationType.BOOKING_CONFIRMED,
          title: "Booking confirmed",
          message: `Your booking for ${asset?.name ?? "a resource"} is confirmed for ${created.startTime.toISOString()}.`,
          relatedEntityType: "Booking",
          relatedEntityId: created.id,
        },
        tx
      );

      return created;
    });

    // A confirmation notification (above) and this reminder are two
    // separate things, per #29's design -- both fire on creation. The
    // reminder itself stays best-effort and OUTSIDE the transaction on
    // purpose (#21's original rationale, preserved): a failed reminder
    // write shouldn't roll back a successful booking.
    await createReminderNotification({
      id: booking.id,
      assetId: booking.assetId,
      bookedById: booking.bookedById,
      startTime: booking.startTime,
    });

    return booking;
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowKnownPrismaErrors(err);
  }
}

async function getOwnedBooking(bookingId: string, requestingUserId: string, requestingUserRole: Role) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  if (booking.bookedById !== requestingUserId && requestingUserRole !== "ADMIN") {
    throw new AppError("You can only manage your own bookings", 403);
  }
  return booking;
}

// SCOPE DECISION (issue #21, still true after #29): the Notification model
// (from #5) has no scheduledFor/sendAt field and there is no background job
// runner/cron anywhere in this codebase — true time-delayed "ahead of
// start time" delivery is still out of scope. This creates the
// Notification row EAGERLY at booking-creation/reschedule time instead,
// with the booking's start time embedded in the message text, so the row
// exists and is retrievable via the polled-REST pattern immediately. This
// remains a placeholder for a future real-scheduling issue to upgrade, not
// final reminder behavior.
//
// #29 refactor: this used to call prisma.notification.create()/deleteMany()
// directly. It now goes through the shared notifyReplacingUnread() in
// notificationService.ts — the dedup-on-reschedule behavior itself (delete
// any existing unread reminder before writing a fresh one) is preserved
// exactly, just relocated into the shared service as an explicit opt-in
// variant of notify() rather than being reimplemented here.
async function createReminderNotification(booking: {
  id: string;
  assetId: string;
  bookedById: string;
  startTime: Date;
}) {
  const asset = await prisma.asset.findUnique({
    where: { id: booking.assetId },
    select: { name: true },
  });

  await notifyReplacingUnread(booking.bookedById, {
    type: NotificationType.BOOKING_REMINDER,
    title: "Upcoming booking reminder",
    message: `Reminder: your booking for ${asset?.name ?? "a resource"} starts at ${booking.startTime.toISOString()}`,
    relatedEntityType: "Booking",
    relatedEntityId: booking.id,
  });
}

export async function cancelBooking(
  bookingId: string,
  requestingUserId: string,
  requestingUserRole: Role
) {
  const booking = await getOwnedBooking(bookingId, requestingUserId, requestingUserRole);

  if (booking.status === "CANCELLED") {
    throw new AppError("Booking is already cancelled", 400);
  }

  // No overlap re-check needed on cancel: checkOverlap() only matches
  // status: "CONFIRMED" bookings, so flipping status away from CONFIRMED
  // is what frees the slot — nothing else has to happen for the slot to
  // become bookable again. The cancellation notification is created in
  // the same transaction as the status flip (#29) so it's atomic — always
  // notify the booker themselves, even when an Admin is the one cancelling
  // on their behalf.
  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      include: { bookedBy: bookedBySummary },
    });

    const asset = await tx.asset.findUnique({ where: { id: updated.assetId }, select: { name: true } });
    await notify(
      booking.bookedById,
      {
        type: NotificationType.BOOKING_CANCELLED,
        title: "Booking cancelled",
        message: `Your booking for ${asset?.name ?? "a resource"} starting ${updated.startTime.toISOString()} was cancelled.`,
        relatedEntityType: "Booking",
        relatedEntityId: updated.id,
      },
      tx
    );

    return updated;
  });
}

export async function rescheduleBooking(
  bookingId: string,
  requestingUserId: string,
  requestingUserRole: Role,
  input: RescheduleBookingInput
) {
  const booking = await getOwnedBooking(bookingId, requestingUserId, requestingUserRole);

  if (booking.status !== "CONFIRMED") {
    throw new AppError("Cannot reschedule a cancelled booking", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    // excludeBookingId is exactly the stub #20 added for this: the booking
    // being moved must not conflict with its own current slot.
    await checkOverlap(booking.assetId, input.startTime, input.endTime, bookingId, tx);

    return tx.booking.update({
      where: { id: bookingId },
      data: { startTime: input.startTime, endTime: input.endTime },
      include: { bookedBy: bookedBySummary },
    });
  });

  await createReminderNotification({
    id: updated.id,
    assetId: updated.assetId,
    bookedById: updated.bookedById,
    startTime: updated.startTime,
  });

  return updated;
}
