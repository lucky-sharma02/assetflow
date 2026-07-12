import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import {
  getAssetUtilizationReport,
  getDepartmentAllocationReport,
  getMaintenanceFrequencyReport,
} from "../services/reportService";

export const reportsRouter = Router();

// Oversight/reporting function, same access level as #27's discrepancy
// report -- not general org-wide data, so gated to Admin/Asset Manager.
reportsRouter.use(authenticate, requireRole("ADMIN", "ASSET_MANAGER"));

reportsRouter.get("/asset-utilization", async (_req, res, next) => {
  try {
    const report = await getAssetUtilizationReport();
    res.json(report);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get("/maintenance-frequency", async (_req, res, next) => {
  try {
    const report = await getMaintenanceFrequencyReport();
    res.json({ items: report });
  } catch (err) {
    next(err);
  }
});

reportsRouter.get("/department-allocation", async (_req, res, next) => {
  try {
    const report = await getDepartmentAllocationReport();
    res.json({ items: report });
  } catch (err) {
    next(err);
  }
});
