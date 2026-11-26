import "server-only";

import { hasPermission } from "@/server/access/catalog";
import type { Actor } from "@/server/access/types";
import { prisma } from "@/server/db";
import { visibleDepartmentIds } from "@/server/access/scope";
import type { Prisma } from "@/generated/prisma/client";

async function scopeWhere(actor: Actor): Promise<Prisma.TicketWhereInput> {
  if (hasPermission(actor.permissions, "tickets.read")) return {};
  const clauses: Prisma.TicketWhereInput[] = [];
  if (hasPermission(actor.permissions, "tickets.read_own")) clauses.push({ requesterId: actor.id });
  if (hasPermission(actor.permissions, "tickets.read_department")) {
    const allowed = await visibleDepartmentIds(actor);
    if (allowed === null) clauses.push({});
    else if (allowed.length > 0) clauses.push({ departmentId: { in: allowed } });
  }
  if (actor.roleKeys.includes("TECHNICIAN") && !hasPermission(actor.permissions, "tickets.read")) {
    clauses.push({ assigneeId: actor.id }, { assigneeId: null });
  }
  return clauses.length ? { OR: clauses } : { id: "__none__" };
}

export async function getHelpdeskDashboard(actor: Actor) {
  if (
    !hasPermission(actor.permissions, "tickets.read") &&
    !hasPermission(actor.permissions, "tickets.read_own") &&
    !hasPermission(actor.permissions, "tickets.read_department") &&
    !actor.roleKeys.includes("TECHNICIAN")
  ) {
    return null;
  }

  const scope = await scopeWhere(actor);
  const [
    total,
    openLike,
    pending,
    resolved,
    closed,
    critical,
    unassigned,
    assignedToMe,
    byStatus,
    byPriority,
    byCategory,
    byDepartment,
    recent,
    technicianWorkload,
  ] = await Promise.all([
    prisma.ticket.count({ where: scope }),
    prisma.ticket.count({
      where: {
        AND: [scope, { status: { in: ["NEW", "OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED", "ESCALATED"] } }],
      },
    }),
    prisma.ticket.count({
      where: { AND: [scope, { status: { in: ["PENDING_USER", "PENDING_VENDOR"] } }] },
    }),
    prisma.ticket.count({ where: { AND: [scope, { status: "RESOLVED" }] } }),
    prisma.ticket.count({ where: { AND: [scope, { status: "CLOSED" }] } }),
    prisma.ticket.count({ where: { AND: [scope, { priority: "CRITICAL" }] } }),
    prisma.ticket.count({ where: { AND: [scope, { assigneeId: null }] } }),
    prisma.ticket.count({ where: { AND: [scope, { assigneeId: actor.id }] } }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["priority"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["categoryId"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["departmentId"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.ticket.findMany({
      where: scope,
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
      },
    }),
    hasPermission(actor.permissions, "tickets.read") || hasPermission(actor.permissions, "tickets.assign")
      ? prisma.user.findMany({
          where: {
            deletedAt: null,
            status: "ACTIVE",
            roles: { some: { role: { key: "TECHNICIAN" } } },
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            specialisation: true,
            _count: {
              select: {
                assignedTickets: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const categoryIds = byCategory.map((row) => row.categoryId).filter((id): id is string => Boolean(id));
  const departmentIds = byDepartment.map((row) => row.departmentId).filter((id): id is string => Boolean(id));
  const [categories, departments] = await Promise.all([
    categoryIds.length
      ? prisma.ticketCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    departmentIds.length
      ? prisma.department.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);
  const categoryName = new Map(categories.map((item) => [item.id, item.name]));
  const departmentName = new Map(departments.map((item) => [item.id, item.name]));

  return {
    total,
    openLike,
    pending,
    resolved,
    closed,
    critical,
    unassigned,
    assignedToMe,
    byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
    byPriority: byPriority.map((row) => ({ priority: row.priority, count: row._count._all })),
    byCategory: byCategory.map((row) => ({
      categoryId: row.categoryId,
      name: row.categoryId ? categoryName.get(row.categoryId) ?? "Unknown" : "Uncategorised",
      count: row._count._all,
    })),
    byDepartment: byDepartment.map((row) => ({
      departmentId: row.departmentId,
      name: row.departmentId ? departmentName.get(row.departmentId) ?? "Unknown" : "Unassigned",
      count: row._count._all,
    })),
    recent,
    technicianWorkload: technicianWorkload.map((item) => ({
      id: item.id,
      name: item.name,
      specialisation: item.specialisation,
      openTickets: item._count.assignedTickets,
    })),
  };
}
