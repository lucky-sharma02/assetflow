import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { PromoteRoleInput } from "../validation/user";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
};

export async function listUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { name: "asc" },
  });
}

// BR-002: only an Admin may promote a user's role — enforced by
// requireRole("ADMIN") on the route, not here.
export async function promoteRole(userId: string, input: PromoteRoleInput) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found", 404);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role: input.role },
    select: userSelect,
  });
}
