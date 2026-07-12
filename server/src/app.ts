import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { assetsRouter } from "./routes/assets";
import { authRouter } from "./routes/auth";
import { bookingsRouter } from "./routes/bookings";
import { categoriesRouter } from "./routes/categories";
import { departmentsRouter } from "./routes/departments";
import { healthRouter } from "./routes/health";
import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/departments", departmentsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/bookings", bookingsRouter);

  app.use(errorHandler);

  return app;
}
