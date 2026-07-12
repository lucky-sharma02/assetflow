import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../services/categoryService";
import { createCategorySchema, updateCategorySchema } from "../validation/category";

export const categoriesRouter = Router();

categoriesRouter.use(authenticate);

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const categories = await listCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.get("/:id", async (req, res, next) => {
  try {
    const category = await getCategory(req.params.id);
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await createCategory(input);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.patch("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = updateCategorySchema.parse(req.body);
    const category = await updateCategory(req.params.id, input);
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    await deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
