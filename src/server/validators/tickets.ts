import { z } from "zod";
import { optionalId, optionalText } from "@/server/validators/common";

const impact = z.enum(["HIGH", "MEDIUM", "LOW"]);
const urgency = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const createTicketSchema = z.object({
  title: z.string().trim().min(5, { error: "Enter a ticket title." }).max(160),
  description: z.string().trim().min(10, { error: "Describe the problem." }).max(8000),
  categoryId: z.string().trim().min(1, { error: "Choose a category." }),
  subcategoryId: optionalId,
  impact,
  urgency,
  affectedEquipment: optionalText(200),
  assetTag: optionalText(80),
  incidentLocationId: optionalId,
  contactName: optionalText(120),
  contactEmail: z
    .union([z.literal(""), z.email({ error: "Enter a valid contact email." })])
    .transform((value) => value || null),
  contactPhone: optionalText(40),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2, { error: "Enter the category name." }).max(120),
  description: optionalText(500),
  parentId: optionalId,
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export const createCategorySchema = updateCategorySchema.extend({
  code: z
    .string()
    .trim()
    .min(2, { error: "Enter a category code." })
    .max(40)
    .regex(/^[A-Z0-9_]+$/, { error: "Use uppercase letters, numbers, and underscores." }),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
