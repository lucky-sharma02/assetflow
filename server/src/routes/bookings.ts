import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  cancelBooking,
  createBooking,
  listBookingsForAsset,
  rescheduleBooking,
} from "../services/bookingService";
import { bookingQuerySchema, createBookingSchema, rescheduleBookingSchema } from "../validation/booking";

export const bookingsRouter = Router();

bookingsRouter.use(authenticate);

bookingsRouter.get("/", async (req, res, next) => {
  try {
    const { assetId } = bookingQuerySchema.parse(req.query);
    const bookings = await listBookingsForAsset(assetId);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const input = createBookingSchema.parse(req.body);
    const booking = await createBooking(req.user!.sub, input);
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.patch("/:id/cancel", async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user!.sub, req.user!.role);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

bookingsRouter.patch("/:id/reschedule", async (req, res, next) => {
  try {
    const input = rescheduleBookingSchema.parse(req.body);
    const booking = await rescheduleBooking(req.params.id, req.user!.sub, req.user!.role, input);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
});
