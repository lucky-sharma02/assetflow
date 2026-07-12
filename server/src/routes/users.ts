import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { listUsers, promoteRole } from "../services/userService";
import { promoteRoleSchema } from "../validation/user";

export const usersRouter = Router();

usersRouter.use(authenticate);

// Directory scope: Admin and Asset Manager only, per the RBAC matrix
// (Employee/Department Head are scoped to their own assets/department,
// not an org-wide people directory).
usersRouter.get("/", requireRole("ADMIN", "ASSET_MANAGER"), async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch("/:id/role", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = promoteRoleSchema.parse(req.body);
    const user = await promoteRole(req.params.id, input);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
