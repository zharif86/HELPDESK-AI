import "server-only";

import type { Actor } from "@/server/access/types";
import { prisma } from "@/server/db";

const ORGANISATION_WIDE = new Set(["SYSTEM_ADMIN", "IT_MANAGER", "TECHNICIAN"]);

export function hasOrganisationScope(actor: Actor) {
  return actor.roleKeys.some((key) => ORGANISATION_WIDE.has(key));
}

/** Null means every department. An array limits a department head to their own tree. */
export async function visibleDepartmentIds(actor: Actor): Promise<string[] | null> {
  if (hasOrganisationScope(actor) || !actor.roleKeys.includes("DEPARTMENT_HEAD")) return null;
  if (!actor.departmentId) return [];

  const rows = await prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true },
  });
  const children = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = children.get(row.parentId) ?? [];
    list.push(row.id);
    children.set(row.parentId, list);
  }

  const allowed: string[] = [];
  const pending = [actor.departmentId];
  const seen = new Set<string>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    allowed.push(current);
    for (const child of children.get(current) ?? []) pending.push(child);
  }
  return allowed;
}
