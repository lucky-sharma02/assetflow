import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import type { SignupInput } from "../validation/auth";

const SALT_ROUNDS = 12;

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // BR-001: signup always creates an Employee — no role selection at signup.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "EMPLOYEE",
    },
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
