import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "../services/departmentService";
import { createDepartmentSchema, updateDepartmentSchema } from "../validation/department";

export const departmentsRouter = Router();

departmentsRouter.use(authenticate);

departmentsRouter.get("/", async (_req, res, next) => {
  try {
    const departments = await listDepartments();
    res.json({ departments });
  } catch (err) {
    next(err);
  }
});

departmentsRouter.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = createDepartmentSchema.parse(req.body);
    const department = await createDepartment(input);
    res.status(201).json({ department });
  } catch (err) {
    next(err);
  }
});

departmentsRouter.patch("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = updateDepartmentSchema.parse(req.body);
    const department = await updateDepartment(req.params.id, input);
    res.json({ department });
  } catch (err) {
    next(err);
  }
});

departmentsRouter.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    await deleteDepartment(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
