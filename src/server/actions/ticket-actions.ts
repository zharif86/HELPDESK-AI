"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readString } from "@/server/forms";
import { createTicket } from "@/server/services/ticket-service";

export async function createTicketAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("tickets.create");
    const created = await createTicket(actor, {
      title: readString(formData, "title"),
      description: readString(formData, "description"),
      categoryId: readString(formData, "categoryId"),
      subcategoryId: readString(formData, "subcategoryId"),
      impact: readString(formData, "impact"),
      urgency: readString(formData, "urgency"),
      affectedEquipment: readString(formData, "affectedEquipment"),
      assetTag: readString(formData, "assetTag"),
      incidentLocationId: readString(formData, "incidentLocationId"),
      contactName: readString(formData, "contactName"),
      contactEmail: readString(formData, "contactEmail"),
      contactPhone: readString(formData, "contactPhone"),
    });
    redirect(`/tickets/${created.id}?notice=ticket-created`);
  } catch (error) {
    return toActionState(error);
  }
}
