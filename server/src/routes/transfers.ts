import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import {
  approveTransfer,
  createTransfer,
  listTransfers,
  rejectTransfer,
} from "../services/transferService";
import { createTransferSchema, transferQuerySchema } from "../validation/transfer";

export const transfersRouter = Router();

transfersRouter.use(authenticate);

transfersRouter.get("/", async (req, res, next) => {
  try {
    const filters = transferQuerySchema.parse(req.query);
    const transfers = await listTransfers(filters);
    res.json({ transfers });
  } catch (err) {
    next(err);
  }
});

// Any authenticated user can request a transfer (BR-007) — RBAC scope
// mirrors "Own ... requests" from the RBAC matrix. Approval, which
// actually moves the asset, is Admin/Asset Manager only, same as
// allocation (#15).
transfersRouter.post("/", async (req, res, next) => {
  try {
    const input = createTransferSchema.parse(req.body);
    const transfer = await createTransfer(input, req.user!.sub);
    res.status(201).json({ transfer });
  } catch (err) {
    next(err);
  }
});

transfersRouter.patch(
  "/:id/approve",
  requireRole("ADMIN", "ASSET_MANAGER"),
  async (req, res, next) => {
    try {
      const transfer = await approveTransfer(req.params.id, req.user!.sub);
      res.json({ transfer });
    } catch (err) {
      next(err);
    }
  }
);

transfersRouter.patch(
  "/:id/reject",
  requireRole("ADMIN", "ASSET_MANAGER"),
  async (req, res, next) => {
    try {
      const transfer = await rejectTransfer(req.params.id, req.user!.sub);
      res.json({ transfer });
    } catch (err) {
      next(err);
    }
  }
);
