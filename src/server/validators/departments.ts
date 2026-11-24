import { z } from "zod";
import { optionalId, optionalText } from "@/server/validators/common";

export const departmentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, { error: "Enter a department code." })
    .max(12)
    .regex(/^[A-Za-z0-9-]+$/, { error: "Use letters, numbers, or hyphens." })
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, { error: "Enter the department name." }).max(120),
  description: optionalText(500),
  parentId: optionalId,
  headUserId: optionalId,
  isActive: z.boolean(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
