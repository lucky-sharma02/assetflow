import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { errorHandler } from "./middleware/errorHandler";
import { activityLogsRouter } from "./routes/activity-logs";
import { allocationsRouter } from "./routes/allocations";
import { assetsRouter } from "./routes/assets";
import { auditsRouter } from "./routes/audits";
import { authRouter } from "./routes/auth";
import { bookingsRouter } from "./routes/bookings";
import { categoriesRouter } from "./routes/categories";
import { dashboardRouter } from "./routes/dashboard";
import { departmentsRouter } from "./routes/departments";
import { healthRouter } from "./routes/health";
import { maintenanceRouter } from "./routes/maintenance";
import { notificationsRouter } from "./routes/notifications";
import { reportsRouter } from "./routes/reports";
import { transfersRouter } from "./routes/transfers";
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
  // Serves uploaded maintenance-request photos (server/uploads/) so the
  // frontend can render photoUrl values directly — local disk storage per
  // CLAUDE.md Section 2, not persistent across redeploys (accepted limitation).
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/departments", departmentsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/allocations", allocationsRouter);
  app.use("/api/transfers", transfersRouter);
  app.use("/api/maintenance", maintenanceRouter);
  app.use("/api/audits", auditsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/activity-logs", activityLogsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/reports", reportsRouter);

  app.use(errorHandler);

  return app;
}
