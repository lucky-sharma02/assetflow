import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validation/category";

function rethrowKnownPrismaErrors(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      throw new AppError("A category with this name already exists", 409);
    }
    if (err.code === "P2025") {
      throw new AppError("Category not found", 404);
    }
  }
  throw err;
}

export async function listCategories() {
  return prisma.assetCategory.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.assetCategory.findUnique({ where: { id } });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  try {
    return await prisma.assetCategory.create({
      data: {
        name: input.name,
        description: input.description,
        extraFields: input.extraFields,
      },
    });
  } catch (err) {
    rethrowKnownPrismaErrors(err);
  }
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  try {
    return await prisma.assetCategory.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        extraFields: input.extraFields === null ? Prisma.JsonNull : input.extraFields,
      },
    });
  } catch (err) {
    rethrowKnownPrismaErrors(err);
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.assetCategory.delete({ where: { id } });
  } catch (err) {
    rethrowKnownPrismaErrors(err);
  }
}
