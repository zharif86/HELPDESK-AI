import "server-only";

import { CATEGORY_SEED } from "@/server/tickets/category-seed";
import { DEFAULT_PRIORITY_MATRIX } from "@/server/tickets/priority-matrix";
import { prisma } from "@/server/db";

export async function seedTicketReferenceData() {
  const idByCode = new Map<string, string>();

  for (const item of CATEGORY_SEED.filter((row) => !row.parentCode)) {
    const existing = await prisma.ticketCategory.findUnique({ where: { code: item.code } });
    if (existing) {
      idByCode.set(item.code, existing.id);
      await prisma.ticketCategory.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description ?? null,
          sortOrder: item.sortOrder,
          parentId: null,
        },
      });
      continue;
    }
    const created = await prisma.ticketCategory.create({
      data: {
        code: item.code,
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
    idByCode.set(item.code, created.id);
  }

  for (const item of CATEGORY_SEED.filter((row) => row.parentCode)) {
    const parentId =
      idByCode.get(item.parentCode!) ??
      (await prisma.ticketCategory.findUnique({ where: { code: item.parentCode! } }))?.id;
    if (!parentId) {
      throw new Error(`Missing parent category ${item.parentCode} for ${item.code}.`);
    }
    idByCode.set(item.parentCode!, parentId);
    const existing = await prisma.ticketCategory.findUnique({ where: { code: item.code } });
    if (existing) {
      idByCode.set(item.code, existing.id);
      await prisma.ticketCategory.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description ?? null,
          sortOrder: item.sortOrder,
          parentId,
        },
      });
      continue;
    }
    const created = await prisma.ticketCategory.create({
      data: {
        code: item.code,
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        parentId,
        isActive: true,
      },
    });
    idByCode.set(item.code, created.id);
  }

  for (const rule of DEFAULT_PRIORITY_MATRIX) {
    await prisma.ticketPriorityRule.upsert({
      where: { impact_urgency: { impact: rule.impact, urgency: rule.urgency } },
      update: { priority: rule.priority },
      create: {
        impact: rule.impact,
        urgency: rule.urgency,
        priority: rule.priority,
      },
    });
  }
}
