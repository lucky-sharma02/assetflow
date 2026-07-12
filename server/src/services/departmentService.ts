import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "../validation/department";

const departmentInclude = {
  head: { select: { id: true, name: true, email: true } },
  _count: { select: { members: true, assets: true } },
} satisfies Prisma.DepartmentInclude;

async function assertHeadExists(headId: string) {
  const head = await prisma.user.findUnique({ where: { id: headId } });
  if (!head) {
    throw new AppError("Department head not found", 404);
  }
}

function rethrowKnownPrismaErrors(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      if (target?.includes("headId")) {
        throw new AppError("This user already heads another department", 409);
      }
      throw new AppError("A department with this name already exists", 409);
    }
    if (err.code === "P2025") {
      throw new AppError("Department not found", 404);
    }
  }
  throw err;
}

export async function listDepartments() {
  return prisma.department.findMany({
    include: departmentInclude,
    orderBy: { name: "asc" },
  });
}

export async function createDepartment(input: CreateDepartmentInput) {
  if (input.headId) {
    await assertHeadExists(input.headId);
  }

  try {
    return await prisma.department.create({
      data: { name: input.name, headId: input.headId },
      include: departmentInclude,
    });
  } catch (err) {
    rethrowKnownPrismaErrors(err);
  }
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput) {
  if (input.headId) {
    await assertHeadExists(input.headId);
  }

  try {
    return await prisma.department.update({
      where: { id },
      data: {
        name: input.name,
        headId: input.headId,
      },
      include: departmentInclude,
    });
  } catch (err) {
    rethrowKnownPrismaErrors(err);
  }
}

export async function deleteDepartment(id: string) {
  try {
    await prisma.department.delete({ where: { id } });
  } catch (err) {
    rethrowKnownPrismaErrors(err);
  }
}
