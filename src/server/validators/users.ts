import { z } from "zod";
import { passwordIssues } from "@/server/auth/password";
import { optionalId, optionalText } from "@/server/validators/common";

const personFields = {
  name: z.string().trim().min(2, { error: "Enter the person's name." }).max(120),
  email: z.email({ error: "Enter a valid email address." }).trim().max(254).toLowerCase(),
  staffId: z
    .string()
    .trim()
    .max(32)
    .transform((value) => (value.length === 0 ? null : value))
    .refine((value) => value === null || /^[A-Za-z0-9-]+$/.test(value), {
      error: "Staff ID can contain letters, numbers, and hyphens.",
    }),
  phone: optionalText(30),
  jobTitle: optionalText(120),
  departmentId: optionalId,
  locationId: optionalId,
  roleIds: z.array(z.string().trim().min(1)).min(1, { error: "Select at least one role." }),
};

export const createUserSchema = z
  .object({
    ...personFields,
    password: z.string().min(1, { error: "Enter a temporary password." }).max(128),
  })
  .superRefine((value, context) => {
    for (const issue of passwordIssues(value.password, value.email)) {
      context.addIssue({ code: "custom", path: ["password"], message: issue });
    }
  });

export const updateUserSchema = z.object(personFields);

export const temporaryPasswordSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1).max(128),
  })
  .superRefine((value, context) => {
    for (const issue of passwordIssues(value.password, value.email)) {
      context.addIssue({ code: "custom", path: ["password"], message: issue });
    }
  });

export const changePasswordSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    currentPassword: z.string().min(1, { error: "Enter your current password." }),
    newPassword: z.string().min(1, { error: "Enter a new password." }).max(128),
  })
  .superRefine((value, context) => {
    if (value.currentPassword === value.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a password that is different from the current one.",
      });
    }
    for (const issue of passwordIssues(value.newPassword, value.email)) {
      context.addIssue({ code: "custom", path: ["newPassword"], message: issue });
    }
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
