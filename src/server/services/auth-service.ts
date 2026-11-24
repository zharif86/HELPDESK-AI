import "server-only";

import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "@/server/auth/password";
import { FixedWindowLimiter } from "@/server/auth/rate-limit";
import { createSessionToken, hashSessionToken } from "@/server/auth/tokens";
import type { RequestMeta } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { logger } from "@/server/logger";
import { getSecuritySettings } from "@/server/services/settings-service";

const INVALID_MESSAGE = "The email or password is incorrect.";
const LOCKED_MESSAGE = "This account is temporarily locked. Try again later or contact a system administrator.";
const DISABLED_MESSAGE = "This account is disabled. Contact a system administrator.";
const RATE_MESSAGE = "Too many sign-in attempts. Wait a few minutes and try again.";

export const loginEmailLimiter = new FixedWindowLimiter(10, 15 * 60 * 1000);
export const loginIpLimiter = new FixedWindowLimiter(30, 15 * 60 * 1000);

export function resetLoginLimiters() {
  loginEmailLimiter.reset();
  loginIpLimiter.reset();
}

export async function loginWithPassword(
  input: { email: string; password: string },
  meta: RequestMeta,
) {
  const email = input.email.trim().toLowerCase();
  if (!loginEmailLimiter.check(`email:${email}`).allowed) {
    return { ok: false as const, message: RATE_MESSAGE };
  }
  if (meta.ipAddress && !loginIpLimiter.check(`ip:${meta.ipAddress}`).allowed) {
    return { ok: false as const, message: RATE_MESSAGE };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || user.deletedAt) {
    await writeAudit(prisma, {
      action: "auth.login.failure",
      entityType: "user",
      summary: "Failed sign-in for an unknown account.",
      metadata: { email },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return { ok: false as const, message: INVALID_MESSAGE };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    logger.info("Sign-in rejected because the account is locked", { userId: user.id });
    return { ok: false as const, message: LOCKED_MESSAGE };
  }

  if (user.status !== "ACTIVE") {
    return { ok: false as const, message: DISABLED_MESSAGE };
  }

  if (!passwordOk) {
    const security = await getSecuritySettings();
    const attempts = user.failedLoginAttempts + 1;
    const locked = attempts >= security.maxFailedLogins;
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: locked ? 0 : attempts,
          lockedUntil: locked ? new Date(Date.now() + security.lockoutMinutes * 60_000) : null,
        },
      });
      await writeAudit(tx, {
        actorId: user.id,
        action: locked ? "auth.account.locked" : "auth.login.failure",
        entityType: "user",
        entityId: user.id,
        summary: locked ? "Account locked after repeated failed sign-in attempts." : "Failed sign-in attempt.",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    });
    return { ok: false as const, message: locked ? LOCKED_MESSAGE : INVALID_MESSAGE };
  }

  const security = await getSecuritySettings();
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + security.sessionHours * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await tx.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    await writeAudit(tx, {
      actorId: user.id,
      action: "auth.login.success",
      entityType: "user",
      entityId: user.id,
      summary: "Signed in.",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  });

  return {
    ok: true as const,
    token,
    expiresAt,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function logoutCurrentSession(token: string | undefined, meta: RequestMeta) {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({ where: { tokenHash } });
  if (!session || session.revokedAt) return;
  await prisma.$transaction(async (tx) => {
    await tx.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    await writeAudit(tx, {
      actorId: session.userId,
      action: "auth.logout",
      entityType: "session",
      entityId: session.id,
      summary: "Signed out.",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  });
}

export async function resolveSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: {
          department: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true } },
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: { select: { key: true } } } } },
              },
            },
          },
        },
      },
    },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  const user = session.user;
  if (user.deletedAt || user.status !== "ACTIVE") return null;

  const permissions = new Set<string>();
  const roles = user.roles.map((assignment) => {
    for (const grant of assignment.role.permissions) permissions.add(grant.permission.key);
    return { id: assignment.role.id, key: assignment.role.key, name: assignment.role.name };
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    staffId: user.staffId,
    phone: user.phone,
    jobTitle: user.jobTitle,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    department: user.department,
    location: user.location,
    roles,
    roleKeys: roles.map((role) => role.key),
    permissions: [...permissions].sort(),
  };
}

export async function revokeUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changeOwnPassword(
  userId: string,
  currentToken: string,
  currentPassword: string,
  newPassword: string,
  meta: RequestMeta,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    throw new AppError("Your account is not available.");
  }
  const currentOk = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentOk) throw new AppError("The current password is incorrect.");
  const passwordHash = await hashPassword(newPassword);
  const currentHash = hashSessionToken(currentToken);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await tx.session.updateMany({
      where: { userId: user.id, revokedAt: null, tokenHash: { not: currentHash } },
      data: { revokedAt: new Date() },
    });
    await writeAudit(tx, {
      actorId: user.id,
      action: "auth.password.changed",
      entityType: "user",
      entityId: user.id,
      summary: "Password changed.",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  });
}
