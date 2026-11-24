import { hasPermission, type PermissionKey } from "@/server/access/catalog";
import type { Actor } from "@/server/access/types";
import { ForbiddenError } from "@/server/errors";

export function assertPermission(actor: Actor, permission: PermissionKey) {
  if (!hasPermission(actor.permissions, permission)) {
    throw new ForbiddenError();
  }
}
