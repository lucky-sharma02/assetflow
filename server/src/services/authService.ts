import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import type { LoginInput, SignupInput } from "../validation/auth";

const SALT_ROUNDS = 12;

// Precedent set in #7 — reused by #8's auth middleware and #9's frontend.
export const AUTH_COOKIE_NAME = "token";
const JWT_EXPIRY = "7d";

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

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: JWT_EXPIRY,
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { token, user: safeUser };
}
