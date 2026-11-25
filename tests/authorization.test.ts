import { beforeEach, describe, expect, it } from "vitest";
import { ForbiddenError } from "../src/server/errors";
import { createDepartment, getDepartment, listDepartments } from "../src/server/services/department-service";
import { createUser, listUsers } from "../src/server/services/user-service";
import { getOrganisationSettings } from "../src/server/services/settings-service";
import { createAccount, resetDatabase } from "./helpers";

beforeEach(async () => {
  await resetDatabase();
});

describe("authorisation", () => {
  it("lets a system administrator list accounts", async () => {
    const { actor } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const result = await listUsers(actor, {});
    expect(result.total).toBe(1);
  });

  it("stops an IT manager from listing accounts", async () => {
    const { actor } = await createAccount({ name: "Manager", email: "manager@test.local", role: "IT_MANAGER" });
    await expect(listUsers(actor, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("stops a technician from creating accounts", async () => {
    const { actor } = await createAccount({ name: "Tech", email: "tech@test.local", role: "TECHNICIAN" });
    await expect(
      createUser(actor, {
        name: "New Person",
        email: "new@test.local",
        staffId: "",
        phone: "",
        jobTitle: "",
        departmentId: "",
        locationId: "",
        roleIds: ["missing"],
        password: "Phase1-Test-2026!",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("stops an employee from opening organisation settings", async () => {
    const { actor } = await createAccount({ name: "Employee", email: "employee@test.local", role: "EMPLOYEE" });
    await expect(getOrganisationSettings(actor)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listDepartments(actor, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("limits a department head to their own department tree", async () => {
    const { actor: admin } = await createAccount({ name: "Admin", email: "admin@test.local", role: "SYSTEM_ADMIN" });
    const finance = await createDepartment(admin, {
      code: "FIN",
      name: "Finance",
      description: "Finance office",
      parentId: "",
      headUserId: "",
      isActive: true,
    });
    const ict = await createDepartment(admin, {
      code: "ICT",
      name: "Information Technology",
      description: "IT office",
      parentId: "",
      headUserId: "",
      isActive: true,
    });
    const { actor: head } = await createAccount({
      name: "Head",
      email: "head@test.local",
      role: "DEPARTMENT_HEAD",
      departmentId: finance.id,
    });
    const visible = await listDepartments(head, { includeInactive: true });
    expect(visible.items.map((item) => item.id)).toEqual([finance.id]);
    expect(await getDepartment(head, ict.id)).toBeNull();
    await expect(listUsers(head, {})).rejects.toBeInstanceOf(ForbiddenError);
  });
});
