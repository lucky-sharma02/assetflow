import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { getAssetById, listAssets, registerAsset } from "../services/assetService";
import { assetQuerySchema, registerAssetSchema } from "../validation/asset";

export const assetsRouter = Router();

assetsRouter.use(authenticate);

assetsRouter.get("/", async (req, res, next) => {
  try {
    const filters = assetQuerySchema.parse(req.query);
    const assets = await listAssets(filters);
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
