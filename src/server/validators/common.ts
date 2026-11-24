import { z, type ZodError } from "zod";

export function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value));

export const optionalId = z
  .string()
  .trim()
  .max(64)
  .transform((value) => (value.length === 0 ? null : value));

export function zodFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(flattened)) {
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === "string");
      if (messages.length > 0) fieldErrors[key] = messages;
    }
  }
  return fieldErrors;
}
