import "server-only";

import { ZodError } from "zod";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError, ForbiddenError, isUniqueViolation } from "@/server/errors";
import { parentCreatesCycle } from "@/server/org/cycles";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/server/validators/tickets";
import { zodFieldErrors } from "@/server/validators/common";

function parseCreate(input: unknown): CreateCategoryInput {
  try {
    return createCategorySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw Object.assign(new AppError("Check the category details."), {
        fieldErrors: zodFieldErrors(error),
      });
    }
    throw error;
  }
}

function parseUpdate(input: unknown): UpdateCategoryInput {
  try {
    return updateCategorySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw Object.assign(new AppError("Check the category details."), {
        fieldErrors: zodFieldErrors(error),
      });
    }
    throw error;
  }
}

export async function listCategories(actor: Actor, options?: { activeOnly?: boolean }) {
  if (
    !actor.permissions.includes("tickets.create") &&
    !actor.permissions.includes("ticket_categories.manage") &&
    !actor.permissions.includes("tickets.read") &&
    !actor.permissions.includes("tickets.read_own") &&
    !actor.permissions.includes("tickets.read_department")
  ) {
    throw new ForbiddenError();
  }
  return prisma.ticketCategory.findMany({
    where: options?.activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true, code: true } },
      _count: { select: { tickets: true, subTickets: true, children: true } },
    },
  });
}

export async function getCategory(actor: Actor, id: string) {
  assertPermission(actor, "ticket_categories.manage");
  return prisma.ticketCategory.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, code: true } },
      children: { orderBy: { sortOrder: "asc" } },
      _count: { select: { tickets: true, subTickets: true } },
    },
  });
}

export async function createCategory(actor: Actor, input: unknown) {
  assertPermission(actor, "ticket_categories.manage");
  const data = parseCreate(input);
  if (data.parentId) {
    const parent = await prisma.ticketCategory.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError("Choose a valid parent category.");
  }
  try {
    const created = await prisma.ticketCategory.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        updatedById: actor.id,
      },
    });
    await writeAudit(prisma, {
      actorId: actor.id,
      action: "ticket_category.created",
      entityType: "ticket_category",
      entityId: created.id,
      summary: `Created category ${created.code}.`,
      metadata: { code: created.code, name: created.name },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("That category code is already in use.");
    throw error;
  }
}

export async function updateCategory(actor: Actor, id: string, input: unknown) {
  assertPermission(actor, "ticket_categories.manage");
  const data = parseUpdate(input);
  const existing = await prisma.ticketCategory.findUnique({
    where: { id },
    include: { children: { select: { id: true, parentId: true } } },
  });
  if (!existing) throw new AppError("Category not found.");

  if (data.parentId) {
    if (data.parentId === id) throw new AppError("A category cannot be its own parent.");
    const rows = await prisma.ticketCategory.findMany({ select: { id: true, parentId: true } });
    const parentById = new Map(rows.map((row) => [row.id, row.parentId]));
    if (parentCreatesCycle(id, data.parentId, parentById)) {
      throw new AppError("That parent would create a circular category structure.");
    }
  }

  const updated = await prisma.ticketCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      updatedById: actor.id,
    },
  });
  await writeAudit(prisma, {
    actorId: actor.id,
    action: "ticket_category.updated",
    entityType: "ticket_category",
    entityId: updated.id,
    summary: `Updated category ${updated.code}.`,
    metadata: { code: updated.code, isActive: updated.isActive },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
  return updated;
}

export async function assertCategoryAssignable(categoryId: string, subcategoryId: string | null) {
  const category = await prisma.ticketCategory.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) {
    throw new AppError("Choose an active incident category.");
  }
  if (!subcategoryId) return { category, subcategory: null };
  const subcategory = await prisma.ticketCategory.findUnique({ where: { id: subcategoryId } });
  if (!subcategory || !subcategory.isActive) {
    throw new AppError("Choose an active subcategory.");
  }
  if (subcategory.parentId !== category.id) {
    throw new AppError("That subcategory does not belong to the selected category.");
  }
  return { category, subcategory };
}
