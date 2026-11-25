"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readString, readStrings } from "@/server/forms";
import { createRole, deleteRole, updateRole } from "@/server/services/role-service";

export async function createRoleAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("roles.manage");
    const created = await createRole(actor, {
      key: readString(formData, "key"),
      name: readString(formData, "name"),
      description: readString(formData, "description"),
      permissions: readStrings(formData, "permissions"),
    });
    redirect(`/admin/roles/${created.id}?notice=role-created`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateRoleAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("roles.manage");
    await updateRole(actor, id, {
      name: readString(formData, "name"),
      description: readString(formData, "description"),
      permissions: readStrings(formData, "permissions"),
    });
    redirect(`/admin/roles/${id}?notice=role-updated`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function deleteRoleAction(id: string, _state: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("roles.manage");
    await deleteRole(actor, id);
    redirect("/admin/roles?notice=role-deleted");
  } catch (error) {
    return toActionState(error);
  }
}
