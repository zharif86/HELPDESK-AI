import { z } from "zod";
import { optionalId, optionalText } from "@/server/validators/common";

export const locationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, { error: "Enter a location code." })
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, { error: "Use letters, numbers, or hyphens." })
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, { error: "Enter the location name." }).max(120),
  building: optionalText(120),
  floor: optionalText(40),
  room: optionalText(40),
  departmentId: optionalId,
  isActive: z.boolean(),
});

export type LocationInput = z.infer<typeof locationSchema>;
