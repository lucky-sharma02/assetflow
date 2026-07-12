import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { listLogs } from "../services/activityLogService";
import { activityLogQuerySchema } from "../validation/activityLog";

export const activityLogsRouter = Router();

// Oversight function, same access level as #27's discrepancy report and
// #31's reports (Admin/Asset Manager only) -- an org-wide audit trail of
// who did what is not "own" data any role's RBAC scope covers, it's
// operational visibility across the whole org.
activityLogsRouter.use(authenticate, requireRole("ADMIN", "ASSET_MANAGER"));

activityLogsRouter.get("/", async (req, res, next) => {
  try {
    const filters = activityLogQuerySchema.parse(req.query);
    const logs = await listLogs(filters);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});
