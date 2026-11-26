import "server-only";

import { ZodError } from "zod";
import { hasPermission } from "@/server/access/catalog";
import { assertPermission } from "@/server/access/guards";
import { visibleDepartmentIds } from "@/server/access/scope";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError, ForbiddenError } from "@/server/errors";
import { assertCanViewTicket } from "@/server/tickets/access";
import { nextTicketNumber } from "@/server/tickets/numbering";
import { assertCategoryAssignable } from "@/server/services/category-service";
import { resolvePriority } from "@/server/services/priority-service";
import { createTicketSchema, type CreateTicketInput } from "@/server/validators/tickets";
import { zodFieldErrors } from "@/server/validators/common";
import type { Prisma, TicketStatus } from "@/generated/prisma/client";

function parseCreate(input: unknown): CreateTicketInput {
  try {
    return createTicketSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw Object.assign(new AppError("Check the ticket details."), {
        fieldErrors: zodFieldErrors(error),
      });
    }
    throw error;
  }
}

async function ticketListWhere(actor: Actor): Promise<Prisma.TicketWhereInput> {
  if (hasPermission(actor.permissions, "tickets.read")) return {};

  const clauses: Prisma.TicketWhereInput[] = [];
  if (hasPermission(actor.permissions, "tickets.read_own")) {
    clauses.push({ requesterId: actor.id });
  }
  if (hasPermission(actor.permissions, "tickets.read_department")) {
    const allowed = await visibleDepartmentIds(actor);
    if (allowed === null) {
      clauses.push({});
    } else if (allowed.length > 0) {
      clauses.push({ departmentId: { in: allowed } });
    }
  }
  if (actor.roleKeys.includes("TECHNICIAN") && !hasPermission(actor.permissions, "tickets.read")) {
    clauses.push({ assigneeId: actor.id }, { assigneeId: null });
  }
  if (clauses.length === 0) {
    throw new ForbiddenError("You do not have permission to list tickets.");
  }
  return { OR: clauses };
}

export async function createTicket(actor: Actor, input: unknown) {
  assertPermission(actor, "tickets.create");
  const data = parseCreate(input);
  await assertCategoryAssignable(data.categoryId, data.subcategoryId);

  const requester = await prisma.user.findUnique({
    where: { id: actor.id },
    include: {
      department: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
    },
  });
  if (!requester || requester.status !== "ACTIVE" || requester.deletedAt) {
    throw new AppError("Your account cannot create tickets.");
  }

  if (data.incidentLocationId) {
    const location = await prisma.location.findFirst({
      where: { id: data.incidentLocationId, deletedAt: null, isActive: true },
    });
    if (!location) throw new AppError("Choose a valid incident location.");
  }

  const priority = await resolvePriority(data.impact, data.urgency);
  const source = actor.roleKeys.includes("SYSTEM_ADMIN") || actor.roleKeys.includes("IT_MANAGER")
    ? "ADMIN"
    : "USER";

  const ticket = await prisma.$transaction(async (tx) => {
    const number = await nextTicketNumber(tx);
    const created = await tx.ticket.create({
      data: {
        number,
        title: data.title,
        description: data.description,
        status: "NEW",
        impact: data.impact,
        urgency: data.urgency,
        priority,
        source,
        contactName: data.contactName ?? requester.name,
        contactEmail: data.contactEmail ?? requester.email,
        contactPhone: data.contactPhone ?? requester.phone,
        affectedEquipment: data.affectedEquipment,
        assetTag: data.assetTag,
        requesterDepartmentName: requester.department?.name ?? null,
        requesterLocationName: requester.location?.name ?? null,
        requesterId: requester.id,
        departmentId: requester.departmentId,
        locationId: requester.locationId,
        incidentLocationId: data.incidentLocationId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await tx.ticketActivity.create({
      data: {
        ticketId: created.id,
        actorId: actor.id,
        action: "ticket.created",
        summary: `Ticket ${created.number} created.`,
        newValue: created.status,
        metadata: {
          priority: created.priority,
          impact: created.impact,
          urgency: created.urgency,
          categoryId: created.categoryId,
        },
      },
    });
    return created;
  });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: "ticket.created",
    entityType: "ticket",
    entityId: ticket.id,
    summary: `Created ticket ${ticket.number}.`,
    metadata: { number: ticket.number, priority: ticket.priority, status: ticket.status },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return ticket;
}

export async function getTicket(actor: Actor, id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, phone: true } },
      assignee: { select: { id: true, name: true, email: true, specialisation: true } },
      department: { select: { id: true, name: true, code: true } },
      location: { select: { id: true, name: true, code: true } },
      incidentLocation: { select: { id: true, name: true, code: true } },
      category: { select: { id: true, name: true, code: true } },
      subcategory: { select: { id: true, name: true, code: true } },
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          assignedBy: { select: { id: true, name: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });
  if (!ticket) return null;
  await assertCanViewTicket(actor, ticket);
  return ticket;
}

export async function listTickets(
  actor: Actor,
  query: {
    q?: string;
    status?: TicketStatus | "";
    priority?: string;
    categoryId?: string;
    departmentId?: string;
    assigneeId?: string | "unassigned";
    from?: string;
    to?: string;
    page?: number;
  },
) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize = 20;
  const scope = await ticketListWhere(actor);
  const q = query.q?.trim();

  const where: Prisma.TicketWhereInput = {
    AND: [
      scope,
      query.status ? { status: query.status } : {},
      query.priority ? { priority: query.priority as never } : {},
      query.categoryId ? { OR: [{ categoryId: query.categoryId }, { subcategoryId: query.categoryId }] } : {},
      query.departmentId ? { departmentId: query.departmentId } : {},
      query.assigneeId === "unassigned"
        ? { assigneeId: null }
        : query.assigneeId
          ? { assigneeId: query.assigneeId }
          : {},
      query.from ? { reportedAt: { gte: new Date(`${query.from}T00:00:00.000Z`) } } : {},
      query.to ? { reportedAt: { lt: new Date(new Date(`${query.to}T00:00:00.000Z`).getTime() + 86_400_000) } } : {},
      q
        ? {
            OR: [
              { number: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { requester: { name: { contains: q, mode: "insensitive" } } },
              { requester: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {},
    ],
  };

  const [items, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: [{ priority: "asc" }, { reportedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
