import { z } from "zod";
import { ALL_PERMISSIONS } from "@/server/access/catalog";

const permissionKey = z.enum(ALL_PERMISSIONS);

export const createRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(3, { error: "Enter a role key." })
    .max(40)
    .regex(/^[A-Z][A-Z0-9_]+$/, { error: "Use uppercase letters, numbers, and underscores." }),
  name: z.string().trim().min(2, { error: "Enter the role name." }).max(80),
  description: z.string().trim().min(8, { error: "Describe what this role is for." }).max(300),
  permissions: z.array(permissionKey).min(1, { error: "Select at least one permission." }),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter the role name." }).max(80),
  description: z.string().trim().min(8, { error: "Describe what this role is for." }).max(300),
  permissions: z.array(permissionKey).min(1, { error: "Select at least one permission." }),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
