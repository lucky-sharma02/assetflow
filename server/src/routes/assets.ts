import { Router } from "express";
import { csvFilename, toCSV } from "../lib/csv";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import {
  getAssetById,
  listAssets,
  listAssetsForExport,
  registerAsset,
} from "../services/assetService";
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

// Must be declared before /:id -- otherwise Express would match this as
// a request for the asset with id "export".
assetsRouter.get("/export", async (_req, res, next) => {
  try {
    const rows = await listAssetsForExport();
    const csv = toCSV(rows, [
      { key: "assetTag", header: "Asset Tag" },
      { key: "name", header: "Name" },
      { key: "category", header: "Category" },
      { key: "department", header: "Department" },
      { key: "status", header: "Status" },
      { key: "condition", header: "Condition" },
      { key: "location", header: "Location" },
      { key: "serialNumber", header: "Serial Number" },
      { key: "isBookable", header: "Bookable" },
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${csvFilename("assets-export")}"`
    );
    res.send(csv);
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
