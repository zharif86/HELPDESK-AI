import "server-only";

import { hasPermission } from "@/server/access/catalog";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError, isUniqueViolation } from "@/server/errors";
import { visibleDepartmentIds } from "@/server/access/scope";
import { locationSchema, type LocationInput } from "@/server/validators/locations";

const PAGE_SIZE = 20;

async function assertDepartment(departmentId: string | null) {
  if (!departmentId) return;
  const department = await prisma.department.findFirst({
    where: { id: departmentId, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (!department) throw new AppError("Select an active department.");
}

export async function listLocations(actor: Actor, query: { q?: string; page?: number }) {
  assertPermission(actor, "locations.read");
  const page = query.page && query.page > 0 ? query.page : 1;
  const q = query.q?.trim();
  const visible = await visibleDepartmentIds(actor);
  const where = {
    deletedAt: null,
    ...(visible ? { departmentId: { in: visible } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q, mode: "insensitive" as const } },
            { building: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.location.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { department: { select: { id: true, code: true, name: true } } },
    }),
    prisma.location.count({ where }),
  ]);
  return { items, total, page, pageSize: PAGE_SIZE };
}

export async function getLocation(actor: Actor, id: string) {
  assertPermission(actor, "locations.read");
  const location = await prisma.location.findFirst({
    where: { id, deletedAt: null },
    include: { department: { select: { id: true, code: true, name: true } } },
  });
  if (!location) return null;
  const visible = await visibleDepartmentIds(actor);
  if (visible && (!location.departmentId || !visible.includes(location.departmentId))) return null;
  return location;
}

export async function createLocation(actor: Actor, input: LocationInput) {
  assertPermission(actor, "locations.manage");
  const data = locationSchema.parse(input);
  await assertDepartment(data.departmentId);
  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.location.create({ data, select: { id: true, code: true, name: true } });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "location.created",
        entityType: "location",
        entityId: created.id,
        summary: `Created location ${created.code}.`,
        metadata: { name: created.name },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("A location with this code already exists.");
    throw error;
  }
}

export async function updateLocation(actor: Actor, id: string, input: LocationInput) {
  assertPermission(actor, "locations.manage");
  const data = locationSchema.parse(input);
  const existing = await prisma.location.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError("That location could not be found.");
  await assertDepartment(data.departmentId);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.location.update({ where: { id }, data });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "location.updated",
        entityType: "location",
        entityId: id,
        summary: `Updated location ${data.code}.`,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("A location with this code already exists.");
    throw error;
  }
}

export async function listLocationOptions(actor: Actor) {
  if (
    !hasPermission(actor.permissions, "locations.read") &&
    !hasPermission(actor.permissions, "users.read") &&
    !hasPermission(actor.permissions, "tickets.create")
  ) {
    assertPermission(actor, "locations.read");
  }
  const visible = await visibleDepartmentIds(actor);
  return prisma.location.findMany({
    where: { deletedAt: null, isActive: true, ...(visible ? { departmentId: { in: visible } } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
}
