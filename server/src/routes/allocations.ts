import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { allocateAsset, listAllocations } from "../services/allocationService";
import { allocationQuerySchema, createAllocationSchema } from "../validation/allocation";

export const allocationsRouter = Router();

allocationsRouter.use(authenticate);

allocationsRouter.get("/", async (req, res, next) => {
  try {
    const filters = allocationQuerySchema.parse(req.query);
    const allocations = await listAllocations(filters);
    res.json({ allocations });
  } catch (err) {
    next(err);
  }
});

allocationsRouter.post("/", requireRole("ADMIN", "ASSET_MANAGER"), async (req, res, next) => {
  try {
    const input = createAllocationSchema.parse(req.body);
    const allocation = await allocateAsset(input, req.user!.sub);
    res.status(201).json({ allocation });
  } catch (err) {
    next(err);
  }
});
