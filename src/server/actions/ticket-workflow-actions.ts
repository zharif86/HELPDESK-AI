"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readString } from "@/server/forms";
import {
  addTicketComment,
  assignTicket,
  changeTicketPriority,
  changeTicketStatus,
} from "@/server/services/ticket-workflow-service";

export async function assignTicketAction(
  ticketId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("tickets.assign");
    await assignTicket(actor, ticketId, {
      assigneeId: readString(formData, "assigneeId"),
      reason: readString(formData, "reason"),
    });
    redirect(`/tickets/${ticketId}?notice=ticket-assigned`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function changeTicketStatusAction(
  ticketId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const status = readString(formData, "status");
    const permission =
      status === "RESOLVED"
        ? "tickets.resolve"
        : status === "CLOSED"
          ? "tickets.close"
          : status === "REOPENED"
            ? "tickets.reopen"
            : status === "CANCELLED"
              ? "tickets.cancel"
              : "tickets.change_status";
    const { actor } = await requirePagePermission(permission);
    await changeTicketStatus(actor, ticketId, {
      status,
      resolution: readString(formData, "resolution"),
      reason: readString(formData, "reason"),
    });
    redirect(`/tickets/${ticketId}?notice=ticket-status`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function changeTicketPriorityAction(
  ticketId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("tickets.change_priority");
    await changeTicketPriority(actor, ticketId, {
      priority: readString(formData, "priority"),
      reason: readString(formData, "reason"),
    });
    redirect(`/tickets/${ticketId}?notice=ticket-updated`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function addTicketCommentAction(
  ticketId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const visibility = readString(formData, "visibility") === "INTERNAL" ? "INTERNAL" : "PUBLIC";
    const permission = visibility === "INTERNAL" ? "tickets.internal_note" : "tickets.comment";
    const { actor } = await requirePagePermission(permission);
    await addTicketComment(actor, ticketId, {
      body: readString(formData, "body"),
      visibility,
    });
    redirect(`/tickets/${ticketId}?notice=ticket-comment`);
  } catch (error) {
    return toActionState(error);
  }
}
