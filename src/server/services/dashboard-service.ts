import "server-only";

import { hasPermission } from "@/server/access/catalog";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { prisma } from "@/server/db";

export async function getDashboard(actor: Actor) {
  assertPermission(actor, "dashboard.view");
  const canReadUsers = hasPermission(actor.permissions, "users.read");
  const canReadDepartments = hasPermission(actor.permissions, "departments.read");
  const canReadLocations = hasPermission(actor.permissions, "locations.read");
  const canReadAudit = hasPermission(actor.permissions, "audit.read");

  const [userCount, activeUserCount, departmentCount, locationCount, roleCounts, recentAudit] =
    await Promise.all([
      canReadUsers ? prisma.user.count({ where: { deletedAt: null } }) : Promise.resolve(null),
      canReadUsers
        ? prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } })
        : Promise.resolve(null),
      canReadDepartments
        ? prisma.department.count({ where: { deletedAt: null, isActive: true } })
        : Promise.resolve(null),
      canReadLocations
        ? prisma.location.count({ where: { deletedAt: null, isActive: true } })
        : Promise.resolve(null),
      canReadUsers
        ? prisma.role.findMany({
            orderBy: { name: "asc" },
            select: { name: true, _count: { select: { users: true } } },
          })
        : Promise.resolve([]),
      canReadAudit
        ? prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { actor: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ]);

  return {
    userCount,
    activeUserCount,
    departmentCount,
    locationCount,
    roleCounts: roleCounts.map((role) => ({ name: role.name, count: role._count.users })),
    recentAudit,
  };
}
