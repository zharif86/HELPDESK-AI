import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ALL_PERMISSIONS } from "../src/server/access/catalog";
import { syncAccessCatalog, seedHelpdeskReferenceData } from "../src/server/access/sync";
import { hashPassword, passwordIssues } from "../src/server/auth/password";
import { createDepartment } from "../src/server/services/department-service";
import { createLocation } from "../src/server/services/location-service";
import { createUser } from "../src/server/services/user-service";
import type { Actor } from "../src/server/access/types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEVELOPMENT_PASSWORDS = new Set(["Helpdesk-Root-2026!", "Desk-User-2026!"]);

async function seedAdministrator() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !name || !password) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD before seeding.");
  }
  if (process.env.NODE_ENV === "production" && process.env.SEED_DEMO_DATA === "true") {
    throw new Error("SEED_DEMO_DATA cannot be enabled in production.");
  }
  if (process.env.NODE_ENV === "production" && process.env.SEED_ADMIN_MUST_CHANGE === "false") {
    throw new Error("Production administrators must change the initial password.");
  }
  if (process.env.NODE_ENV === "production" && DEVELOPMENT_PASSWORDS.has(password)) {
    throw new Error("Refusing a known development password in production.");
  }
  if (passwordIssues(password, email).length > 0) {
    throw new Error("ADMIN_PASSWORD does not meet the password policy.");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const role = await prisma.role.findUniqueOrThrow({ where: { key: "SYSTEM_ADMIN" } });
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      status: "ACTIVE",
      mustChangePassword: process.env.SEED_ADMIN_MUST_CHANGE === "false" ? false : true,
      roles: { create: { roleId: role.id } },
    },
  });
}

async function seedDemo(actor: Actor) {
  if (process.env.SEED_DEMO_DATA !== "true") return;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing demonstration accounts in production.");
  }
  const password = process.env.DEMO_USER_PASSWORD ?? "";
  if (passwordIssues(password, "demo@helpdesk.local").length > 0) {
    throw new Error("DEMO_USER_PASSWORD does not meet the password policy.");
  }
  const existing = await prisma.department.count();
  if (existing > 0) return;

  const ict = await createDepartment(actor, {
    code: "ICT",
    name: "Information Technology",
    description: "Internal IT support and infrastructure.",
    parentId: "",
    headUserId: "",
    isActive: true,
  });
  const finance = await createDepartment(actor, {
    code: "FIN",
    name: "Finance",
    description: "Finance and accounts.",
    parentId: "",
    headUserId: "",
    isActive: true,
  });
  await createDepartment(actor, {
    code: "HR",
    name: "Human Resource",
    description: "People and administration.",
    parentId: "",
    headUserId: "",
    isActive: true,
  });

  const hq = await createLocation(actor, {
    code: "HQ-L3",
    name: "Headquarters Level 3",
    building: "Headquarters",
    floor: "3",
    room: "",
    departmentId: ict.id,
    isActive: true,
  });
  await createLocation(actor, {
    code: "HQ-L1",
    name: "Headquarters Level 1",
    building: "Headquarters",
    floor: "1",
    room: "",
    departmentId: finance.id,
    isActive: true,
  });

  const roles = await prisma.role.findMany({ select: { id: true, key: true } });
  const roleId = (key: string) => roles.find((role) => role.key === key)?.id ?? "";

  await createUser(actor, {
    name: "Aina Rahman",
    email: "manager@helpdesk.local",
    staffId: "ICT-1001",
    phone: "",
    jobTitle: "IT Manager",
    departmentId: ict.id,
    locationId: hq.id,
    roleIds: [roleId("IT_MANAGER")],
    password,
  });
  await createUser(actor, {
    name: "Hafiz Omar",
    email: "technician@helpdesk.local",
    staffId: "ICT-1002",
    phone: "",
    jobTitle: "IT Technician",
    departmentId: ict.id,
    locationId: hq.id,
    roleIds: [roleId("TECHNICIAN")],
    password,
  });
  await createUser(actor, {
    name: "Siti Nurhaliza",
    email: "employee@helpdesk.local",
    staffId: "FIN-2001",
    phone: "",
    jobTitle: "Accounts Officer",
    departmentId: finance.id,
    locationId: "",
    roleIds: [roleId("EMPLOYEE")],
    password,
  });
}

async function main() {
  await syncAccessCatalog();
  await seedHelpdeskReferenceData();
  const settings = [
    ["organisation.name", "AI IT Helpdesk", "Name shown on the sign-in page and navigation."],
    ["organisation.supportEmail", "ict-support@helpdesk.local", "Contact email shown to signed-in users."],
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
  const admin = await seedAdministrator();
  const actor: Actor = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    departmentId: admin.departmentId,
    roleKeys: ["SYSTEM_ADMIN"],
    permissions: [...ALL_PERMISSIONS],
    ipAddress: null,
    userAgent: "seed",
  };
  await seedDemo(actor);
  console.log(`Administrator ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
