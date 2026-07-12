import { Router } from "express";
import { upload } from "../lib/multer";
import { authenticate } from "../middleware/authenticate";
import { raise } from "../services/maintenanceService";
import { createMaintenanceRequestSchema } from "../validation/maintenance";

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
