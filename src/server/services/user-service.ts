import "server-only";

import { hashPassword } from "@/server/auth/password";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError, isUniqueViolation } from "@/server/errors";
import { createUserSchema, temporaryPasswordSchema, updateUserSchema } from "@/server/validators/users";
import type { CreateUserInput, UpdateUserInput } from "@/server/validators/users";

const PAGE_SIZE = 20;

const userListSelect = {
  id: true,
  name: true,
  email: true,
  staffId: true,
  jobTitle: true,
  phone: true,
  status: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  department: { select: { id: true, code: true, name: true } },
  location: { select: { id: true, code: true, name: true } },
  roles: { select: { role: { select: { id: true, key: true, name: true } } } },
} as const;

async function assertRelations(input: { departmentId: string | null; locationId: string | null; roleIds: string[] }) {
  const roles = await prisma.role.findMany({ where: { id: { in: input.roleIds } }, select: { id: true } });
  if (roles.length !== new Set(input.roleIds).size) {
    throw new AppError("One of the selected roles is no longer available.");
  }
  if (input.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: input.departmentId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!department) throw new AppError("Select an active department.");
  }
  if (input.locationId) {
    const location = await prisma.location.findFirst({
      where: { id: input.locationId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!location) throw new AppError("Select an active location.");
  }
}

async function countOtherActiveAdmins(userId: string) {
  return prisma.user.count({
    where: {
      id: { not: userId },
      status: "ACTIVE",
      deletedAt: null,
      roles: { some: { role: { key: "SYSTEM_ADMIN" } } },
    },
  });
}

async function userIsSystemAdmin(userId: string) {
  const match = await prisma.userRole.findFirst({
    where: { userId, role: { key: "SYSTEM_ADMIN" } },
    select: { userId: true },
  });
  return Boolean(match);
}

export async function listUsers(
  actor: Actor,
  query: { q?: string; status?: string; page?: number },
) {
  assertPermission(actor, "users.read");
  const page = query.page && query.page > 0 ? query.page : 1;
  const q = query.q?.trim();
  const status = query.status === "ACTIVE" || query.status === "INACTIVE" ? query.status : undefined;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { staffId: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: [{ name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, pageSize: PAGE_SIZE };
}

export async function getUser(actor: Actor, userId: string) {
  assertPermission(actor, "users.read");
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: userListSelect,
  });
  if (!user) return null;
  return user;
}

export async function createUser(actor: Actor, input: CreateUserInput) {
  assertPermission(actor, "users.create");
  const data = createUserSchema.parse(input);
  await assertRelations(data);
  const passwordHash = await hashPassword(data.password);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          staffId: data.staffId,
          phone: data.phone,
          jobTitle: data.jobTitle,
          departmentId: data.departmentId,
          locationId: data.locationId,
          passwordHash,
          mustChangePassword: true,
          status: "ACTIVE",
          createdById: actor.id,
          updatedById: actor.id,
          roles: { create: data.roleIds.map((roleId) => ({ roleId, assignedById: actor.id })) },
        },
        select: { id: true, email: true, name: true },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "user.created",
        entityType: "user",
        entityId: created.id,
        summary: `Created account for ${created.name}.`,
        metadata: { email: created.email, roleIds: data.roleIds },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
      return created;
    });
    return user;
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("An account with this email or staff ID already exists.");
    throw error;
  }
}

export async function updateUser(actor: Actor, userId: string, input: UpdateUserInput) {
  assertPermission(actor, "users.update");
  const data = updateUserSchema.parse(input);
  if (actor.id === userId) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: { select: { roleId: true } } },
    });
    const currentIds = new Set(current?.roles.map((role) => role.roleId) ?? []);
    const nextIds = new Set(data.roleIds);
    const sameSize = currentIds.size === nextIds.size;
    const sameRoles = sameSize && [...currentIds].every((id) => nextIds.has(id));
    if (!sameRoles) throw new AppError("Ask another system administrator to change your roles.");
  }
  await assertRelations(data);
  const existing = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!existing) throw new AppError("That account could not be found.");

  const nextRoles = await prisma.role.findMany({
    where: { id: { in: data.roleIds } },
    select: { key: true },
  });
  const keepsAdmin = nextRoles.some((role) => role.key === "SYSTEM_ADMIN");
  if ((await userIsSystemAdmin(userId)) && !keepsAdmin && (await countOtherActiveAdmins(userId)) === 0) {
    throw new AppError("The last active system administrator cannot be removed from that role.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email,
          staffId: data.staffId,
          phone: data.phone,
          jobTitle: data.jobTitle,
          departmentId: data.departmentId,
          locationId: data.locationId,
          updatedById: actor.id,
        },
      });
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: data.roleIds.map((roleId) => ({ userId, roleId, assignedById: actor.id })),
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "user.updated",
        entityType: "user",
        entityId: userId,
        summary: `Updated account for ${data.name}.`,
        metadata: {
          email: data.email,
          departmentId: data.departmentId,
          locationId: data.locationId,
          roleIds: data.roleIds,
        },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("An account with this email or staff ID already exists.");
    throw error;
  }
}

export async function setUserStatus(actor: Actor, userId: string, status: "ACTIVE" | "INACTIVE") {
  assertPermission(actor, "users.deactivate");
  if (actor.id === userId && status === "INACTIVE") {
    throw new AppError("You cannot deactivate your own account.");
  }
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new AppError("That account could not be found.");
  if (status === "INACTIVE" && (await userIsSystemAdmin(userId)) && (await countOtherActiveAdmins(userId)) === 0) {
    throw new AppError("The last active system administrator cannot be deactivated.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        status,
        updatedById: actor.id,
        ...(status === "ACTIVE" ? { failedLoginAttempts: 0, lockedUntil: null } : {}),
      },
    });
    if (status === "INACTIVE") {
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await writeAudit(tx, {
      actorId: actor.id,
      action: status === "ACTIVE" ? "user.reactivated" : "user.deactivated",
      entityType: "user",
      entityId: userId,
      summary: status === "ACTIVE" ? `Reactivated ${user.name}.` : `Deactivated ${user.name}.`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  });
}

export async function setTemporaryPassword(actor: Actor, userId: string, password: string) {
  assertPermission(actor, "users.update");
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new AppError("That account could not be found.");
  const parsed = temporaryPasswordSchema.parse({ email: user.email, password });
  const passwordHash = await hashPassword(parsed.password);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedById: actor.id,
      },
    });
    await tx.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "user.password.reset",
      entityType: "user",
      entityId: userId,
      summary: `Set a temporary password for ${user.name}.`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  });
}

export async function listRoleOptions() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    select: { id: true, key: true, name: true, description: true },
  });
}
