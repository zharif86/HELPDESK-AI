import "server-only";

import { PERMISSIONS, ROLE_TEMPLATES } from "@/server/access/catalog";
import { hashPassword, passwordIssues } from "@/server/auth/password";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";

const BLOCKED_ADMIN_PASSWORDS = new Set(["change-this-password", "password", "admin123", "Admin123!"]);

export async function syncAccessCatalog() {
  for (const [key, permission] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: permission.description, module: permission.module },
      create: { key, description: permission.description, module: permission.module },
    });
  }

  const permissions = await prisma.permission.findMany({
    where: { key: { in: Object.keys(PERMISSIONS) } },
    select: { id: true, key: true },
  });
  const idByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));

  for (const [key, template] of Object.entries(ROLE_TEMPLATES)) {
    const existing = await prisma.role.findUnique({
      where: { key },
      include: { permissions: { select: { permissionId: true } } },
    });
    if (!existing) {
      await prisma.role.create({
        data: {
          key,
          name: template.name,
          description: template.description,
          isSystem: true,
          permissions: {
            create: template.permissions.map((permissionKey) => ({
              permissionId: idByKey.get(permissionKey)!,
            })),
          },
        },
      });
      continue;
    }
    if (key !== "SYSTEM_ADMIN") continue;
    const held = new Set(existing.permissions.map((grant) => grant.permissionId));
    const missing = template.permissions
      .map((permissionKey) => idByKey.get(permissionKey))
      .filter((id): id is string => Boolean(id) && !held.has(id));
    if (missing.length > 0) {
      await prisma.rolePermission.createMany({
        data: missing.map((permissionId) => ({ roleId: existing.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }
}

export async function seedDefaultSettings() {
  const settings = [
    ["organisation.name", "AI IT Helpdesk", "Name shown on the sign-in page and navigation."],
    ["organisation.supportEmail", "", "Contact email shown to signed-in users."],
    ["security.sessionHours", 8, "How long a new sign-in session remains valid."],
    ["security.maxFailedLogins", 5, "Failed sign-in attempts before a temporary lock."],
    ["security.lockoutMinutes", 15, "How long a locked account stays locked."],
  ] as const;
  for (const [key, value, description] of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value, description },
    });
  }
}

export async function seedAdministrator() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !name || !password) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD before seeding.");
  }
  if (BLOCKED_ADMIN_PASSWORDS.has(password) || passwordIssues(password, email).length > 0) {
    throw new Error("ADMIN_PASSWORD does not meet the password policy. Replace the example value before seeding.");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const role = await prisma.role.findUniqueOrThrow({ where: { key: "SYSTEM_ADMIN" } });
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      status: "ACTIVE",
      mustChangePassword: true,
      roles: { create: { roleId: role.id } },
    },
  });
  await writeAudit(prisma, {
    action: "system.admin.bootstrapped",
    entityType: "user",
    entityId: user.id,
    summary: "Initial system administrator account created.",
    metadata: { email },
  });
  return user;
}
