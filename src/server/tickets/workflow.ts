import type { TicketStatus } from "@/generated/prisma/client";

/** Controlled transitions. Validated on the server before any status write. */
export const TICKET_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "OPEN", "CANCELLED"],
  IN_PROGRESS: ["PENDING_USER", "PENDING_VENDOR", "ESCALATED", "RESOLVED", "ASSIGNED"],
  PENDING_USER: ["IN_PROGRESS", "CANCELLED"],
  PENDING_VENDOR: ["IN_PROGRESS", "CANCELLED"],
  ESCALATED: ["IN_PROGRESS", "ASSIGNED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "ASSIGNED"],
  CANCELLED: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus) {
  return TICKET_TRANSITIONS[from].includes(to);
}
