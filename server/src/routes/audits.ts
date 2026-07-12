import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import {
  createCycle,
  listCycles,
  listPendingItemsForAuditor,
  recordResult,
} from "../services/auditService";
import { createAuditCycleSchema, recordAuditResultSchema } from "../validation/audit";

export const auditsRouter = Router();

auditsRouter.use(authenticate);

auditsRouter.get("/", async (_req, res, next) => {
  try {
    const auditCycles = await listCycles();
    res.json({ auditCycles });
  } catch (err) {
    next(err);
  }
});

auditsRouter.get("/my-pending-items", async (req, res, next) => {
  try {
    const items = await listPendingItemsForAuditor(req.user!.sub);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

auditsRouter.post("/", requireRole("ADMIN", "ASSET_MANAGER"), async (req, res, next) => {
  try {
    const input = createAuditCycleSchema.parse(req.body);
    const auditCycle = await createCycle(req.user!.sub, input);
    res.status(201).json({ auditCycle });
  } catch (err) {
    next(err);
  }
});

// authenticate-only, not requireRole -- authorization here is an
// ownership check (is this user assigned to this specific audit cycle?),
// which recordResult() enforces in the service layer since it's a
// data-dependent decision a route-level role gate can't express.
auditsRouter.patch("/:cycleId/items/:itemId", async (req, res, next) => {
  try {
    const input = recordAuditResultSchema.parse(req.body);
    const item = await recordResult(req.params.cycleId, req.params.itemId, req.user!.sub, input);
    res.json({ item });
  } catch (err) {
    next(err);
  }
});
