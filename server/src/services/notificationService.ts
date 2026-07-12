import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

type QueryClient = PrismaClient | Prisma.TransactionClient;

// Notification.type is a plain String column (see schema.prisma), not a
// Prisma enum -- this is just a shared set of literals so every trigger
// point uses the same spelling instead of hand-typing strings.
export const NotificationType = {
  BOOKING_REMINDER: "BOOKING_REMINDER",
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  ASSET_ASSIGNED: "ASSET_ASSIGNED",
  MAINTENANCE_APPROVED: "MAINTENANCE_APPROVED",
  MAINTENANCE_REJECTED: "MAINTENANCE_REJECTED",
  TRANSFER_APPROVED: "TRANSFER_APPROVED",
  AUDIT_DISCREPANCY: "AUDIT_DISCREPANCY",
} as const;

export interface NotifyParams {
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

// The single shared notification-creation path. Every service that needs to
// notify a user should call this instead of prisma.notification.create()
// directly -- this replaces #21's private createReminderNotification()
// inline in bookingService.ts, which is now just a caller of this function.
// Accepts an optional transaction client so callers can create the
// notification atomically with the state change that triggered it (see
// each trigger point for how this is used).
export async function notify(userId: string, params: NotifyParams, client: QueryClient = prisma) {
  return client.notification.create({
    data: {
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
    },
  });
}

// #21 established that rescheduling a booking should delete any existing
// UNREAD reminder for that booking before writing a fresh one, so a
// reschedule never leaves a stale duplicate referencing the old time. That
// dedup behavior is specific to "replace an unread notification of this
// exact type+entity", not something every notification needs -- kept here
// as an optional variant rather than baked into notify() itself, so callers
// that don't need dedup (the other five trigger points) aren't affected.
export async function notifyReplacingUnread(
  userId: string,
  params: NotifyParams & { relatedEntityType: string; relatedEntityId: string },
  client: QueryClient = prisma
) {
  await client.notification.deleteMany({
    where: {
      type: params.type,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      userId,
      isRead: false,
    },
  });
  return notify(userId, params, client);
}

export async function listForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Ownership-enforced, same shape as bookingService's getOwnedBooking /
// auditService's assignment check: 404 if the notification doesn't exist,
// 403 if it exists but belongs to someone else. No role override -- a
// notification is always personal, there's no "Admin manages everyone's
// notifications" concept anywhere in the RBAC matrix.
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
  if (notification.userId !== userId) {
    throw new AppError("You can only mark your own notifications as read", 403);
  }
  if (notification.isRead) {
    return notification;
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
