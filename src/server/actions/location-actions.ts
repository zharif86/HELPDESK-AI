"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readChecked, readString } from "@/server/forms";
import { createLocation, updateLocation } from "@/server/services/location-service";

function locationFromForm(formData: FormData) {
  return {
    code: readString(formData, "code"),
    name: readString(formData, "name"),
    building: readString(formData, "building"),
    floor: readString(formData, "floor"),
    room: readString(formData, "room"),
    departmentId: readString(formData, "departmentId"),
    isActive: readChecked(formData, "isActive"),
  };
}

export async function createLocationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("locations.manage");
    const created = await createLocation(actor, locationFromForm(formData));
    redirect(`/admin/locations/${created.id}?notice=created`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateLocationAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("locations.manage");
    await updateLocation(actor, id, locationFromForm(formData));
    redirect(`/admin/locations/${id}?notice=updated`);
  } catch (error) {
    return toActionState(error);
  }
}
