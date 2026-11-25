import "server-only";

import { hasPermission } from "@/server/access/catalog";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError, isUniqueViolation } from "@/server/errors";
import { parentCreatesCycle } from "@/server/org/cycles";
import { visibleDepartmentIds } from "@/server/access/scope";
import { departmentSchema, type DepartmentInput } from "@/server/validators/departments";

const PAGE_SIZE = 20;

async function assertHeadAndParent(input: DepartmentInput, departmentId?: string) {
  if (input.headUserId) {
    const head = await prisma.user.findFirst({
      where: { id: input.headUserId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (!head) throw new AppError("The department head must be an active account.");
  }
  if (input.parentId) {
    const parent = await prisma.department.findFirst({
      where: { id: input.parentId, deletedAt: null },
      select: { id: true },
    });
    if (!parent) throw new AppError("The parent department could not be found.");
  }
  if (!departmentId) return;
  const rows = await prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true },
  });
  const parentById = new Map(rows.map((row) => [row.id, row.parentId]));
  if (parentCreatesCycle(departmentId, input.parentId, parentById)) {
    throw new AppError("A department cannot be placed inside itself.");
  }
  if (!input.isActive) {
    const activeChild = await prisma.department.findFirst({
      where: { parentId: departmentId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (activeChild) {
      throw new AppError("Deactivate or move the active child departments first.");
    }
  }
}

export async function listDepartments(actor: Actor, query: { q?: string; page?: number; includeInactive?: boolean }) {
  assertPermission(actor, "departments.read");
  const page = query.page && query.page > 0 ? query.page : 1;
  const q = query.q?.trim();
  const visible = await visibleDepartmentIds(actor);
  const where = {
    deletedAt: null,
    ...(visible ? { id: { in: visible } } : {}),
    ...(query.includeInactive ? {} : { isActive: true }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        parent: { select: { id: true, code: true, name: true } },
        head: { select: { id: true, name: true } },
        _count: { select: { users: true, children: true } },
      },
    }),
    prisma.department.count({ where }),
  ]);
  return { items, total, page, pageSize: PAGE_SIZE };
}

export async function getDepartment(actor: Actor, id: string) {
  assertPermission(actor, "departments.read");
  const visible = await visibleDepartmentIds(actor);
  if (visible && !visible.includes(id)) return null;
  return prisma.department.findFirst({
    where: { id, deletedAt: null },
    include: {
      parent: { select: { id: true, name: true, code: true } },
      head: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createDepartment(actor: Actor, input: DepartmentInput) {
  assertPermission(actor, "departments.manage");
  const data = departmentSchema.parse(input);
  await assertHeadAndParent(data);
  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.department.create({
        data,
        select: { id: true, name: true, code: true },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "department.created",
        entityType: "department",
        entityId: created.id,
        summary: `Created department ${created.code}.`,
        metadata: { name: created.name },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("A department with this code already exists.");
    throw error;
  }
}

export async function updateDepartment(actor: Actor, id: string, input: DepartmentInput) {
  assertPermission(actor, "departments.manage");
  const data = departmentSchema.parse(input);
  const existing = await prisma.department.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new AppError("That department could not be found.");
  await assertHeadAndParent(data, id);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.department.update({ where: { id }, data });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "department.updated",
        entityType: "department",
        entityId: id,
        summary: `Updated department ${data.code}.`,
        metadata: { name: data.name, isActive: data.isActive },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("A department with this code already exists.");
    throw error;
  }
}

export async function listDepartmentOptions(actor: Actor) {
  if (!hasPermission(actor.permissions, "departments.read") && !hasPermission(actor.permissions, "users.read")) {
    assertPermission(actor, "departments.read");
  }
  const visible = await visibleDepartmentIds(actor);
  return prisma.department.findMany({
    where: { deletedAt: null, isActive: true, ...(visible ? { id: { in: visible } } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export async function listActiveUsersForHead(actor: Actor) {
  assertPermission(actor, "departments.manage");
  return prisma.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}
