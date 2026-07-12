import { Router } from "express";
import { upload } from "../lib/multer";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { approve, raise, reject, resolve } from "../services/maintenanceService";
import { createMaintenanceRequestSchema, rejectMaintenanceRequestSchema } from "../validation/maintenance";

export const maintenanceRouter = Router();

maintenanceRouter.use(authenticate);

maintenanceRouter.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const input = createMaintenanceRequestSchema.parse(req.body);
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const maintenanceRequest = await raise(req.user!.sub, input, photoUrl);
    res.status(201).json({ maintenanceRequest });
  } catch (err) {
    next(err);
  }
});

maintenanceRouter.patch("/:id/approve", requireRole("ASSET_MANAGER"), async (req, res, next) => {
  try {
    const maintenanceRequest = await approve(req.params.id, req.user!.sub);
    res.json({ maintenanceRequest });
  } catch (err) {
    next(err);
  }
});

maintenanceRouter.patch("/:id/reject", requireRole("ASSET_MANAGER"), async (req, res, next) => {
  try {
    const input = rejectMaintenanceRequestSchema.parse(req.body);
    const maintenanceRequest = await reject(req.params.id, req.user!.sub, input);
    res.json({ maintenanceRequest });
  } catch (err) {
    next(err);
  }
});

maintenanceRouter.patch("/:id/resolve", requireRole("ASSET_MANAGER"), async (req, res, next) => {
  try {
    const maintenanceRequest = await resolve(req.params.id);
    res.json({ maintenanceRequest });
  } catch (err) {
    next(err);
  }
});
