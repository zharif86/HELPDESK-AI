import "server-only";

import { hasPermission, LOCKED_SYSTEM_ADMIN_PERMISSIONS, PERMISSIONS, ROLE_TEMPLATES } from "@/server/access/catalog";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError, isUniqueViolation } from "@/server/errors";
import { createRoleSchema, updateRoleSchema } from "@/server/validators/roles";

function withLockedAdminPermissions(roleKey: string, permissions: string[]) {
  if (roleKey !== "SYSTEM_ADMIN") return [...new Set(permissions)];
  return [...new Set([...permissions, ...LOCKED_SYSTEM_ADMIN_PERMISSIONS])];
}

function assertCanGrant(actor: Actor, permissions: readonly string[]) {
  if (!actor.roleKeys.includes("SYSTEM_ADMIN") && permissions.some((key) => !hasPermission(actor.permissions, key))) {
    throw new AppError("You cannot grant a permission you do not hold.");
  }
}

async function permissionIds(keys: string[]) {
  const rows = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true },
  });
  if (rows.length !== new Set(keys).size) {
    throw new AppError("One of the selected permissions is not available.");
  }
  return rows.map((row) => row.id);
}

export async function listRoles(actor: Actor) {
  assertPermission(actor, "roles.read");
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      permissions: { include: { permission: { select: { key: true, description: true, module: true } } } },
      _count: { select: { users: true } },
    },
  });
}

export async function getRole(actor: Actor, id: string) {
  assertPermission(actor, "roles.read");
  return prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

export function permissionCatalog() {
  return Object.entries(PERMISSIONS).map(([key, value]) => ({ key, ...value }));
}

export async function createRole(actor: Actor, input: unknown) {
  assertPermission(actor, "roles.manage");
  const data = createRoleSchema.parse(input);
  if (data.key in ROLE_TEMPLATES) throw new AppError("That role key is reserved.");
  assertCanGrant(actor, data.permissions);
  const ids = await permissionIds(data.permissions);
  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          key: data.key,
          name: data.name,
          description: data.description,
          isSystem: false,
          permissions: { create: ids.map((permissionId) => ({ permissionId })) },
        },
        select: { id: true, key: true, name: true },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "role.created",
        entityType: "role",
        entityId: created.id,
        summary: `Created role ${created.name}.`,
        metadata: { key: created.key, permissions: data.permissions },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("A role with this key already exists.");
    throw error;
  }
}

export async function updateRole(actor: Actor, id: string, input: unknown) {
  assertPermission(actor, "roles.manage");
  const data = updateRoleSchema.parse(input);
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new AppError("That role could not be found.");
  if (role.key === "SYSTEM_ADMIN" && !actor.roleKeys.includes("SYSTEM_ADMIN")) {
    throw new AppError("Only a system administrator can change that role.");
  }
  const permissions = withLockedAdminPermissions(role.key, data.permissions);
  assertCanGrant(actor, permissions);
  const ids = await permissionIds(permissions);
  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    await tx.rolePermission.createMany({ data: ids.map((permissionId) => ({ roleId: id, permissionId })) });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "role.updated",
      entityType: "role",
      entityId: id,
      summary: `Updated role ${data.name}.`,
      metadata: { permissions },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  });
}

export async function deleteRole(actor: Actor, id: string) {
  assertPermission(actor, "roles.manage");
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) throw new AppError("That role could not be found.");
  if (role.key === "SYSTEM_ADMIN" && !actor.roleKeys.includes("SYSTEM_ADMIN")) {
    throw new AppError("Only a system administrator can change that role.");
  }
  if (role.isSystem) throw new AppError("System roles cannot be deleted.");
  if (role._count.users > 0) throw new AppError("Remove this role from every account before deleting it.");
  await prisma.$transaction(async (tx) => {
    await tx.role.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "role.deleted",
      entityType: "role",
      entityId: id,
      summary: `Deleted role ${role.name}.`,
      metadata: { key: role.key },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  });
}
