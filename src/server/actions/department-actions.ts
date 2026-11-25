"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readChecked, readString } from "@/server/forms";
import { createDepartment, updateDepartment } from "@/server/services/department-service";

function departmentFromForm(formData: FormData) {
  return {
    code: readString(formData, "code"),
    name: readString(formData, "name"),
    description: readString(formData, "description"),
    parentId: readString(formData, "parentId"),
    headUserId: readString(formData, "headUserId"),
    isActive: readChecked(formData, "isActive"),
  };
}

export async function createDepartmentAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("departments.manage");
    const created = await createDepartment(actor, departmentFromForm(formData));
    redirect(`/admin/departments/${created.id}?notice=created`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateDepartmentAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("departments.manage");
    await updateDepartment(actor, id, departmentFromForm(formData));
    redirect(`/admin/departments/${id}?notice=updated`);
  } catch (error) {
    return toActionState(error);
  }
}
