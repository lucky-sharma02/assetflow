import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE_NAME, login, signup } from "../services/authService";
import { loginSchema, signupSchema } from "../validation/auth";

export const authRouter = Router();

const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_EXPIRY

authRouter.post("/signup", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const user = await signup(input);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const { token, user } = await login(input);
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
    });
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { passwordHash: _passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
});
