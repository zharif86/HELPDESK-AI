import "server-only";

import { hasPermission } from "@/server/access/catalog";
import { visibleDepartmentIds } from "@/server/access/scope";
import type { Actor } from "@/server/access/types";
import { ForbiddenError } from "@/server/errors";

type TicketAccessRow = {
  id: string;
  requesterId: string;
  departmentId: string | null;
  assigneeId: string | null;
};

export async function canViewTicket(actor: Actor, ticket: TicketAccessRow) {
  if (hasPermission(actor.permissions, "tickets.read")) return true;
  if (hasPermission(actor.permissions, "tickets.read_own") && ticket.requesterId === actor.id) {
    return true;
  }
  if (hasPermission(actor.permissions, "tickets.read_department")) {
    const allowed = await visibleDepartmentIds(actor);
    if (allowed === null) return true;
    if (ticket.departmentId && allowed.includes(ticket.departmentId)) return true;
  }
  // Technicians without org-wide tickets.read can still open assigned or unassigned queue items.
  if (
    actor.roleKeys.includes("TECHNICIAN") &&
    (ticket.assigneeId === actor.id || ticket.assigneeId === null)
  ) {
    return true;
  }
  return false;
}

export async function assertCanViewTicket(actor: Actor, ticket: TicketAccessRow) {
  if (!(await canViewTicket(actor, ticket))) {
    throw new ForbiddenError("You do not have access to this ticket.");
  }
}

export function canReadInternalNotes(actor: Actor) {
  return hasPermission(actor.permissions, "tickets.internal_note");
}
