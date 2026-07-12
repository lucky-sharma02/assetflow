import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { listForUser, markAllAsRead, markAsRead } from "../services/notificationService";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

// authenticate-only, scoped to req.user.sub inside the service -- same
// "own resource" pattern as bookings/maintenance, not a role gate.
notificationsRouter.get("/", async (req, res, next) => {
  try {
    const notifications = await listForUser(req.user!.sub);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    await markAllAsRead(req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await markAsRead(req.params.id, req.user!.sub);
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});
