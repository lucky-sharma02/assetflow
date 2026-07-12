import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { getDashboardSummary } from "../services/dashboardService";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// Org-wide aggregate counts — Admin/Asset Manager only, same scope as
// the employee directory (#12): this isn't "own assets/bookings" data,
// it's operational visibility across the whole org.
dashboardRouter.get("/", requireRole("ADMIN", "ASSET_MANAGER"), async (_req, res, next) => {
  try {
    const summary = await getDashboardSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
