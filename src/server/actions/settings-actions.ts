"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readString } from "@/server/forms";
import { updateOrganisationSettings } from "@/server/services/settings-service";

export async function updateSettingsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("settings.manage");
    await updateOrganisationSettings(actor, {
      organisationName: readString(formData, "organisationName"),
      supportEmail: readString(formData, "supportEmail"),
      sessionHours: Number(readString(formData, "sessionHours")),
      maxFailedLogins: Number(readString(formData, "maxFailedLogins")),
      lockoutMinutes: Number(readString(formData, "lockoutMinutes")),
    });
    redirect("/admin/settings?notice=settings-saved");
  } catch (error) {
    return toActionState(error);
  }
}
