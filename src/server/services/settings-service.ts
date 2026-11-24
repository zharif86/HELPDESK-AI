import "server-only";

import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { settingsSchema, type SettingsInput } from "@/server/validators/settings";

const DEFAULTS = {
  organisationName: "AI IT Helpdesk",
  supportEmail: "",
  sessionHours: 8,
  maxFailedLogins: 5,
  lockoutMinutes: 15,
};

function readNumber(value: unknown, fallback: number, min: number, max: number) {
  const number = typeof value === "number" ? value : Number.NaN;
  if (!Number.isInteger(number) || number < min || number > max) return fallback;
  return number;
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

export async function getPublicBranding() {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: ["organisation.name", "organisation.supportEmail"] } },
    });
    const values = new Map(rows.map((row) => [row.key, row.value]));
    return {
      organisationName: readText(values.get("organisation.name"), DEFAULTS.organisationName) || DEFAULTS.organisationName,
      supportEmail: readText(values.get("organisation.supportEmail"), ""),
    };
  } catch {
    return {
      organisationName: DEFAULTS.organisationName,
      supportEmail: DEFAULTS.supportEmail,
    };
  }
}

export async function getSecuritySettings() {
  const rows = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ["security.sessionHours", "security.maxFailedLogins", "security.lockoutMinutes"],
      },
    },
  });
  const values = new Map(rows.map((row) => [row.key, row.value]));
  return {
    sessionHours: readNumber(values.get("security.sessionHours"), DEFAULTS.sessionHours, 1, 12),
    maxFailedLogins: readNumber(values.get("security.maxFailedLogins"), DEFAULTS.maxFailedLogins, 3, 10),
    lockoutMinutes: readNumber(values.get("security.lockoutMinutes"), DEFAULTS.lockoutMinutes, 5, 120),
  };
}

export async function getOrganisationSettings(actor: Actor) {
  assertPermission(actor, "settings.manage");
  const [branding, security] = await Promise.all([getPublicBranding(), getSecuritySettings()]);
  return { ...branding, ...security };
}

export async function updateOrganisationSettings(actor: Actor, input: SettingsInput) {
  assertPermission(actor, "settings.manage");
  const data = settingsSchema.parse(input);
  const previous = await getOrganisationSettings(actor);
  const entries = [
    ["organisation.name", data.organisationName, "Name shown on the sign-in page and navigation."],
    ["organisation.supportEmail", data.supportEmail, "Contact email shown to signed-in users."],
    ["security.sessionHours", data.sessionHours, "How long a new sign-in session remains valid."],
    ["security.maxFailedLogins", data.maxFailedLogins, "Failed sign-in attempts before a temporary lock."],
    ["security.lockoutMinutes", data.lockoutMinutes, "How long a locked account stays locked."],
  ] as const;

  await prisma.$transaction(async (tx) => {
    for (const [key, value, description] of entries) {
      await tx.systemSetting.upsert({
        where: { key },
        update: { value, description, updatedById: actor.id },
        create: { key, value, description, updatedById: actor.id },
      });
    }
    await writeAudit(tx, {
      actorId: actor.id,
      action: "settings.updated",
      entityType: "system_settings",
      summary: "Organisation settings updated.",
      metadata: { previous, next: data },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  });
}
