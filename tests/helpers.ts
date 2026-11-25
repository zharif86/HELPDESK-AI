import type { Actor } from "../src/server/access/types";
import { syncAccessCatalog, seedDefaultSettings } from "../src/server/access/sync";
import { hashPassword } from "../src/server/auth/password";
import { prisma } from "../src/server/db";

export const TEST_PASSWORD = "Phase1-Test-2026!";

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      audit_logs,
      sessions,
      user_roles,
      role_permissions,
      system_settings,
      locations,
      departments,
      users,
      roles,
      permissions
    RESTART IDENTITY CASCADE
  `);
  await syncAccessCatalog();
  await seedDefaultSettings();
}

export async function createAccount(input: {
  name: string;
  email: string;
  role: "SYSTEM_ADMIN" | "IT_MANAGER" | "TECHNICIAN" | "EMPLOYEE" | "DEPARTMENT_HEAD";
  departmentId?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  password?: string;
}) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: input.role } });
  const password = input.password ?? TEST_PASSWORD;
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(password),
      status: input.status ?? "ACTIVE",
      departmentId: input.departmentId ?? null,
      mustChangePassword: false,
      roles: { create: { roleId: role.id } },
    },
  });
  return { user, password, actor: await actorFor(user.id) };
}

export async function actorFor(userId: string): Promise<Actor> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  });
  const permissions = new Set<string>();
  const roleKeys: string[] = [];
  for (const assignment of user.roles) {
    roleKeys.push(assignment.role.key);
    for (const grant of assignment.role.permissions) permissions.add(grant.permission.key);
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    departmentId: user.departmentId,
    roleKeys,
    permissions: [...permissions],
    ipAddress: null,
    userAgent: "test",
  };
}

export async function disconnectTestDatabase() {
  await prisma.$disconnect();
}

export { prisma };
