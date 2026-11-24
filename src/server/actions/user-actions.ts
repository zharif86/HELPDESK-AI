"use server";

import { redirect } from "next/navigation";
import { requirePagePermission } from "@/server/auth/current-user";
import { passwordsMatch, readString, readStrings } from "@/server/forms";
import { toActionState, type ActionState } from "@/server/actions/state";
import { createUser, setTemporaryPassword, setUserStatus, updateUser } from "@/server/services/user-service";

function personFromForm(formData: FormData) {
  return {
    name: readString(formData, "name"),
    email: readString(formData, "email"),
    staffId: readString(formData, "staffId"),
    phone: readString(formData, "phone"),
    jobTitle: readString(formData, "jobTitle"),
    departmentId: readString(formData, "departmentId"),
    locationId: readString(formData, "locationId"),
    roleIds: readStrings(formData, "roleIds"),
  };
}

export async function createUserAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("users.create");
    const password = readString(formData, "password");
    const mismatch = passwordsMatch(password, readString(formData, "confirmPassword"));
    if (mismatch) return mismatch;
    const user = await createUser(actor, { ...personFromForm(formData), password });
    redirect(`/admin/users/${user.id}?notice=created`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateUserAction(userId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("users.update");
    await updateUser(actor, userId, personFromForm(formData));
    redirect(`/admin/users/${userId}?notice=updated`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "INACTIVE") {
  const { actor } = await requirePagePermission("users.deactivate");
  await setUserStatus(actor, userId, status);
  redirect(`/admin/users/${userId}?notice=${status === "ACTIVE" ? "reactivated" : "deactivated"}`);
}

export async function resetPasswordAction(userId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { actor } = await requirePagePermission("users.update");
    const password = readString(formData, "password");
    const mismatch = passwordsMatch(password, readString(formData, "confirmPassword"));
    if (mismatch) return mismatch;
    await setTemporaryPassword(actor, userId, password);
    redirect(`/admin/users/${userId}?notice=password-reset`);
  } catch (error) {
    return toActionState(error);
  }
}
