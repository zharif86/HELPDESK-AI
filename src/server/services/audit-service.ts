import "server-only";

import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { prisma } from "@/server/db";

const PAGE_SIZE = 25;

export async function listAuditLogs(
  actor: Actor,
  query: { q?: string; action?: string; actorId?: string; from?: string; to?: string; page?: number },
) {
  assertPermission(actor, "audit.read");
  const page = query.page && query.page > 0 ? query.page : 1;
  const q = query.q?.trim();
  const action = query.action?.trim();
  const from = parseDay(query.from);
  const to = parseDay(query.to, true);
  const where = {
    ...(action ? { action } : {}),
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { summary: { contains: q, mode: "insensitive" as const } },
            { action: { contains: q, mode: "insensitive" as const } },
            { actor: { name: { contains: q, mode: "insensitive" as const } } },
            { actor: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [items, total, actions] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);
  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    actions: actions.map((item) => item.action),
  };
}

export async function listAccountHistory(actor: Actor, userId: string) {
  assertPermission(actor, "users.read");
  return prisma.auditLog.findMany({
    where: { entityType: "user", entityId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true } } },
  });
}

function parseDay(value: string | undefined, nextDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (nextDay) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}
