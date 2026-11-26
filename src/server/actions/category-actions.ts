"use server";

import { redirect } from "next/navigation";
import { toActionState, type ActionState } from "@/server/actions/state";
import { requirePagePermission } from "@/server/auth/current-user";
import { readChecked, readString } from "@/server/forms";
import { createCategory, updateCategory } from "@/server/services/category-service";

export async function createCategoryAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("ticket_categories.manage");
    const created = await createCategory(actor, {
      code: readString(formData, "code").toUpperCase(),
      name: readString(formData, "name"),
      description: readString(formData, "description"),
      parentId: readString(formData, "parentId"),
      isActive: readChecked(formData, "isActive"),
      sortOrder: Number(readString(formData, "sortOrder") || "0"),
    });
    redirect(`/admin/ticket-categories/${created.id}?notice=created`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateCategoryAction(
  id: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("ticket_categories.manage");
    await updateCategory(actor, id, {
      name: readString(formData, "name"),
      description: readString(formData, "description"),
      parentId: readString(formData, "parentId"),
      isActive: readChecked(formData, "isActive"),
      sortOrder: Number(readString(formData, "sortOrder") || "0"),
    });
    redirect(`/admin/ticket-categories/${id}?notice=updated`);
  } catch (error) {
    return toActionState(error);
  }
}
