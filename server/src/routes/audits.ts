import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { createCycle, listCycles } from "../services/auditService";
import { createAuditCycleSchema } from "../validation/audit";

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

auditsRouter.post("/", requireRole("ADMIN", "ASSET_MANAGER"), async (req, res, next) => {
  try {
    const input = createAuditCycleSchema.parse(req.body);
    const auditCycle = await createCycle(req.user!.sub, input);
    res.status(201).json({ auditCycle });
  } catch (err) {
    next(err);
  }
});
