"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readString } from "@/server/forms";
import { uploadTicketAttachment } from "@/server/services/attachment-service";

export async function uploadTicketAttachmentAction(
  ticketId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const isInternal = readString(formData, "isInternal") === "true";
    const permission = isInternal ? "tickets.internal_note" : "tickets.comment";
    const { actor } = await requirePagePermission(permission);
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { status: "error", message: "Choose a file to upload." };
    }
    await uploadTicketAttachment(actor, ticketId, file, { isInternal });
    redirect(`/tickets/${ticketId}?notice=ticket-updated`);
  } catch (error) {
    return toActionState(error);
  }
}
