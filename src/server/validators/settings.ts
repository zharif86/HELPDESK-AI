import { z } from "zod";

export const settingsSchema = z.object({
  organisationName: z.string().trim().min(2, { error: "Enter the organisation name." }).max(120),
  supportEmail: z.union([
    z.literal(""),
    z.email({ error: "Enter a valid support email, or leave it blank." }),
  ]),
  sessionHours: z.coerce.number().int().min(1).max(12),
  maxFailedLogins: z.coerce.number().int().min(3).max(10),
  lockoutMinutes: z.coerce.number().int().min(5).max(120),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
