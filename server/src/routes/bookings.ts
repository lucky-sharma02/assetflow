import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { createBooking, listBookingsForAsset } from "../services/bookingService";
import { bookingQuerySchema, createBookingSchema } from "../validation/booking";

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
