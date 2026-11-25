import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "../src/server/errors";
import { listAuditLogs } from "../src/server/services/audit-service";
import { createDepartment, updateDepartment } from "../src/server/services/department-service";
import { createLocation } from "../src/server/services/location-service";
import { createRole } from "../src/server/services/role-service";
import { createUser, setUserStatus, updateUser } from "../src/server/services/user-service";
import { loginWithPassword, resetLoginLimiters } from "../src/server/services/auth-service";
import { createAccount, prisma, resetDatabase, TEST_PASSWORD } from "./helpers";

beforeEach(async () => {
  resetLoginLimiters();
  await resetDatabase();
});

describe("administration", () => {
  it("creates and updates a user, and records the audit", async () => {
    const { actor } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "EMPLOYEE" } });
    const created = await createUser(actor, {
      name: "Aina Rahman",
      email: "aina@test.local",
      staffId: "ICT-1",
      phone: "",
      jobTitle: "Officer",
      departmentId: "",
      locationId: "",
      roleIds: [role.id],
      password: TEST_PASSWORD,
    });
    await updateUser(actor, created.id, {
      name: "Aina Rahman Ali",
      email: "aina@test.local",
      staffId: "ICT-1",
      phone: "",
      jobTitle: "Senior Officer",
      departmentId: "",
      locationId: "",
      roleIds: [role.id],
    });
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
    expect(saved.name).toBe("Aina Rahman Ali");
    const audit = await listAuditLogs(actor, { q: "Aina" });
    expect(audit.total).toBeGreaterThan(0);
  });

  it("creates a department and a location", async () => {
    const { actor } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const department = await createDepartment(actor, {
      code: "ICT",
      name: "Information Technology",
      description: "Support",
      parentId: "",
      headUserId: "",
      isActive: true,
    });
    const location = await createLocation(actor, {
      code: "HQ-L3",
      name: "Headquarters Level 3",
      building: "Headquarters",
      floor: "3",
      room: "301",
      departmentId: department.id,
      isActive: true,
    });
    expect(location.code).toBe("HQ-L3");
  });

  it("rejects a permission that is not in the catalogue", async () => {
    const { actor } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    await expect(
      createRole(actor, {
        key: "AUDITOR",
        name: "Auditor",
        description: "Reads audit records only.",
        permissions: ["not.a.permission"],
      }),
    ).rejects.toThrow();
  });

  it("refuses to deactivate the last administrator", async () => {
    const { actor, user } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    await expect(setUserStatus(actor, user.id, "INACTIVE")).rejects.toBeInstanceOf(AppError);
  });

  it("rejects a duplicate email", async () => {
    const { actor } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "EMPLOYEE" } });
    const input = {
      name: "Second",
      email: "admin@test.local",
      staffId: "",
      phone: "",
      jobTitle: "",
      departmentId: "",
      locationId: "",
      roleIds: [role.id],
      password: TEST_PASSWORD,
    };
    await expect(createUser(actor, input)).rejects.toBeInstanceOf(AppError);
  });

  it("rejects a department cycle", async () => {
    const { actor } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const parent = await createDepartment(actor, {
      code: "ROOT",
      name: "Root",
      description: "Top",
      parentId: "",
      headUserId: "",
      isActive: true,
    });
    const child = await createDepartment(actor, {
      code: "CHILD",
      name: "Child",
      description: "Nested",
      parentId: parent.id,
      headUserId: "",
      isActive: true,
    });
    await expect(
      updateDepartment(actor, parent.id, {
        code: "ROOT",
        name: "Root",
        description: "Top",
        parentId: child.id,
        headUserId: "",
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("stops a deactivated account from signing in", async () => {
    const { actor } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "EMPLOYEE" } });
    const created = await createUser(actor, {
      name: "Employee",
      email: "person@test.local",
      staffId: "",
      phone: "",
      jobTitle: "",
      departmentId: "",
      locationId: "",
      roleIds: [role.id],
      password: TEST_PASSWORD,
    });
    await setUserStatus(actor, created.id, "INACTIVE");
    const result = await loginWithPassword(
      { email: "person@test.local", password: TEST_PASSWORD },
      { ipAddress: null, userAgent: "test" },
    );
    expect(result.ok).toBe(false);
  });
});
