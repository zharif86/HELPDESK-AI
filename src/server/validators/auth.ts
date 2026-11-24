import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Enter the email address for your account." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Enter your password." }).max(128),
});
