"use server";

import { redirect } from "next/navigation";
import { isSafeNextPath } from "@/lib/paths";
import { setSessionCookie, clearSessionCookie, readSessionCookie } from "@/server/auth/cookie";
import { loginWithPassword, logoutCurrentSession } from "@/server/services/auth-service";
import { getRequestMeta } from "@/server/http/request-meta";
import { passwordsMatch, readString } from "@/server/forms";
import { idleState, toActionState, type ActionState } from "@/server/actions/state";
import { loginSchema } from "@/server/validators/auth";
import { changePasswordSchema } from "@/server/validators/users";
import { requireUser } from "@/server/auth/current-user";
import { changeOwnPassword } from "@/server/services/auth-service";

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = loginSchema.safeParse({
      email: readString(formData, "email"),
      password: readString(formData, "password"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Enter the email and password for your account.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const result = await loginWithPassword(parsed.data, await getRequestMeta());
    if (!result.ok) return { status: "error", message: result.message };
    await setSessionCookie(result.token, result.expiresAt);
    const next = readString(formData, "next");
    if (result.mustChangePassword) redirect("/account/password");
    redirect(isSafeNextPath(next) ? next : "/dashboard");
  } catch (error) {
    return toActionState(error);
  }
}

export async function logoutAction() {
  const meta = await getRequestMeta();
  const token = await readSessionCookie();
  await logoutCurrentSession(token, meta);
  await clearSessionCookie();
  redirect("/login");
}

export async function changePasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user } = await requireUser("password-change");
    const mismatch = passwordsMatch(readString(formData, "newPassword"), readString(formData, "confirmPassword"));
    if (mismatch) return mismatch;
    const parsed = changePasswordSchema.parse({
      email: user.email,
      currentPassword: readString(formData, "currentPassword"),
      newPassword: readString(formData, "newPassword"),
    });
    const token = await readSessionCookie();
    if (!token) redirect("/login");
    await changeOwnPassword(user.id, token, parsed.currentPassword, parsed.newPassword, await getRequestMeta());
    redirect("/dashboard?notice=password-changed");
  } catch (error) {
    return toActionState(error);
  }
}

export { idleState };
