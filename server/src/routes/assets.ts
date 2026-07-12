import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { getAssetById, listAssets, registerAsset } from "../services/assetService";
import { registerAssetSchema } from "../validation/asset";

export const assetsRouter = Router();

assetsRouter.use(authenticate);

assetsRouter.get("/", async (_req, res, next) => {
  try {
    const assets = await listAssets();
    res.json({ assets });
  } catch (err) {
    next(err);
  }
});

assetsRouter.get("/:id", async (req, res, next) => {
  try {
    const asset = await getAssetById(req.params.id);
    res.json({ asset });
  } catch (err) {
    next(err);
  }
});

assetsRouter.post("/", requireRole("ADMIN", "ASSET_MANAGER"), async (req, res, next) => {
  try {
    const input = registerAssetSchema.parse(req.body);
    const asset = await registerAsset(input);
    res.status(201).json({ asset });
  } catch (err) {
    next(err);
  }
});
