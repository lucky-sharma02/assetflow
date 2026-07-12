import { Router } from "express";
import { signup } from "../services/authService";
import { signupSchema } from "../validation/auth";

export const authRouter = Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const user = await signup(input);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});
