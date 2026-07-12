import { z } from "zod"

// Mirrors server/src/validation/auth.ts. No shared package between
// client/server yet (see CLAUDE.md known decisions) — keep these in sync
// by hand if the server schemas change.

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type SignupFormValues = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormValues = z.infer<typeof loginSchema>
