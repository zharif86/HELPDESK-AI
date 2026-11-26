import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PermissionKey } from "@/server/access/catalog";
import { hasPermission } from "@/server/access/catalog";
import type { Actor } from "@/server/access/types";
import { resolveSession } from "@/server/services/auth-service";
import { getRequestMeta } from "@/server/http/request-meta";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof resolveSession>>>;

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveSession(token);
});

async function actorFromUser(user: CurrentUser): Promise<Actor> {
  const meta = await getRequestMeta();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    departmentId: user.department?.id ?? null,
    roleKeys: user.roleKeys,
    permissions: user.permissions,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  };
}

export async function requireUser(purpose: "default" | "password-change" | "logout" = "default") {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/session/end");
  if (user.mustChangePassword && purpose === "default") redirect("/account/password");
  return { user, actor: await actorFromUser(user) };
}

export async function requirePagePermission(permission: PermissionKey) {
  const context = await requireUser();
  if (!hasPermission(context.user.permissions, permission)) redirect("/forbidden");
  return context;
}

export async function requireAnyPagePermission(permissions: readonly PermissionKey[]) {
  const context = await requireUser();
  if (!permissions.some((permission) => hasPermission(context.user.permissions, permission))) {
    redirect("/forbidden");
  }
  return context;
}

export async function currentPathname() {
  return (await headers()).get("x-pathname") ?? "";
}
