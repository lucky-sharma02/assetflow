import { Router } from "express";
import { csvFilename, toCSV } from "../lib/csv";
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

// Department-wise allocation was chosen as the one report to make
// exportable: it's naturally one row per department with clean scalar
// columns, unlike asset utilization (a single percentage breakdown, not
// really "rows") -- maintenance frequency is also tabular and could gain
// an export the same way later if needed.
reportsRouter.get("/department-allocation/export", async (_req, res, next) => {
  try {
    const items = await getDepartmentAllocationReport();
    const csv = toCSV(items, [
      { key: "departmentName", header: "Department" },
      { key: "totalAssets", header: "Total Assets" },
      { key: "allocatedAssets", header: "Allocated Assets" },
      { key: "percentage", header: "Allocated %" },
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${csvFilename("department-allocation")}"`
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
});
