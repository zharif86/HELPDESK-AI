import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { AppError } from "@/server/errors";
import { logger } from "@/server/logger";
import { zodFieldErrors } from "@/server/validators/common";

export type ActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const idleState: ActionState = { status: "idle" };

export function toActionState(error: unknown): ActionState {
  unstable_rethrow(error);
  if (error instanceof ZodError) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: zodFieldErrors(error),
    };
  }
  if (error instanceof AppError) return { status: "error", message: error.message };
  logger.error("Unhandled application error", {
    error: error instanceof Error ? error.message : "unknown",
  });
  return { status: "error", message: "Something went wrong. Please try again." };
}
