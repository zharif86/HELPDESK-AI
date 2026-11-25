import { beforeEach, describe, expect, it } from "vitest";
import { hashSessionToken } from "../src/server/auth/tokens";
import { loginWithPassword, resetLoginLimiters, resolveSession } from "../src/server/services/auth-service";
import { createAccount, prisma, resetDatabase, TEST_PASSWORD } from "./helpers";

const meta = { ipAddress: null, userAgent: "test" };

beforeEach(async () => {
  resetLoginLimiters();
  await resetDatabase();
});

describe("authentication", () => {
  it("accepts a valid password", async () => {
    const { user } = await createAccount({
      name: "Admin",
      email: "admin@test.local",
      role: "SYSTEM_ADMIN",
    });
    const result = await loginWithPassword({ email: user.email, password: TEST_PASSWORD }, meta);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const session = await resolveSession(result.token);
      expect(session?.id).toBe(user.id);
    }
  });

  it("rejects an invalid password", async () => {
    await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const result = await loginWithPassword({ email: "admin@test.local", password: "Wrong-Password-1!" }, meta);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/incorrect/i);
  });

  it("locks an account after repeated failures", async () => {
    await prisma.systemSetting.update({ where: { key: "security.maxFailedLogins" }, data: { value: 3 } });
    await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await loginWithPassword({ email: "admin@test.local", password: "Wrong-Password-1!" }, meta);
    }
    const locked = await loginWithPassword({ email: "admin@test.local", password: "Wrong-Password-1!" }, meta);
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.message).toMatch(/locked/i);
  });

  it("rejects an expired session", async () => {
    const { user } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const token = "expired-session-token";
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    expect(await resolveSession(token)).toBeNull();
  });

  it("rejects a revoked session", async () => {
    const { user } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const token = "revoked-session-token";
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
      },
    });
    expect(await resolveSession(token)).toBeNull();
  });

  it("rejects an inactive account", async () => {
    await createAccount({
      name: "Admin",
      email: "admin@test.local",
      role: "SYSTEM_ADMIN",
      status: "INACTIVE",
    });
    const result = await loginWithPassword({ email: "admin@test.local", password: TEST_PASSWORD }, meta);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/disabled/i);
  });
});
