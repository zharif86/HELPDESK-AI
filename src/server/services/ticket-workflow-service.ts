import "server-only";

import { ZodError, z } from "zod";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { assertCanViewTicket, canReadInternalNotes } from "@/server/tickets/access";
import { canTransition } from "@/server/tickets/workflow";
import { resolvePriority } from "@/server/services/priority-service";
import { zodFieldErrors } from "@/server/validators/common";
import type { TicketPriority, TicketStatus } from "@/generated/prisma/client";

const statusSchema = z.object({
  status: z.enum([
    "NEW",
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "PENDING_USER",
    "PENDING_VENDOR",
    "ESCALATED",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
    "CANCELLED",
  ]),
  resolution: z.string().trim().max(8000).optional().transform((value) => value || null),
  reason: z.string().trim().max(2000).optional().transform((value) => value || null),
});

const assignSchema = z.object({
  assigneeId: z.string().trim().min(1, { error: "Choose a technician." }),
  reason: z.string().trim().max(1000).optional().transform((value) => value || null),
});

const prioritySchema = z.object({
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  reason: z.string().trim().min(5, { error: "Explain why the priority is changing." }).max(1000),
});

const commentSchema = z.object({
  body: z.string().trim().min(2, { error: "Enter a comment." }).max(4000),
  visibility: z.enum(["PUBLIC", "INTERNAL"]),
});

function parse<T>(schema: z.ZodType<T>, input: unknown, message: string): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw Object.assign(new AppError(message), { fieldErrors: zodFieldErrors(error) });
    }
    throw error;
  }
}

async function loadTicket(id: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new AppError("Ticket not found.");
  return ticket;
}

export async function listTechnicianOptions(actor: Actor) {
  assertPermission(actor, "tickets.assign");
  const technicians = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      roles: { some: { role: { key: { in: ["TECHNICIAN", "IT_MANAGER"] } } } },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      specialisation: true,
      _count: { select: { assignedTickets: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } } } } },
    },
  });
  return technicians.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    specialisation: item.specialisation,
    openTickets: item._count.assignedTickets,
  }));
}

export async function assignTicket(actor: Actor, ticketId: string, input: unknown) {
  assertPermission(actor, "tickets.assign");
  const data = parse(assignSchema, input, "Check the assignment details.");
  const ticket = await loadTicket(ticketId);
  await assertCanViewTicket(actor, ticket);

  const assignee = await prisma.user.findFirst({
    where: {
      id: data.assigneeId,
      deletedAt: null,
      status: "ACTIVE",
      roles: { some: { role: { key: { in: ["TECHNICIAN", "IT_MANAGER", "SYSTEM_ADMIN"] } } } },
    },
  });
  if (!assignee) throw new AppError("Choose an active technician.");

  const previousAssigneeId = ticket.assigneeId;
  const nextStatus: TicketStatus =
    ticket.status === "NEW" || ticket.status === "OPEN" || ticket.status === "REOPENED"
      ? "ASSIGNED"
      : ticket.status;

  const updated = await prisma.$transaction(async (tx) => {
    if (previousAssigneeId) {
      await tx.ticketAssignment.updateMany({
        where: { ticketId, unassignedAt: null },
        data: { unassignedAt: new Date(), reassignmentReason: data.reason },
      });
    }
    await tx.ticketAssignment.create({
      data: {
        ticketId,
        assigneeId: assignee.id,
        assignedById: actor.id,
        reassignmentReason: previousAssigneeId ? data.reason : null,
      },
    });
    const row = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        assigneeId: assignee.id,
        status: nextStatus,
        updatedById: actor.id,
      },
    });
    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorId: actor.id,
        action: previousAssigneeId ? "ticket.reassigned" : "ticket.assigned",
        summary: previousAssigneeId
          ? `Reassigned to ${assignee.name}.`
          : `Assigned to ${assignee.name}.`,
        previousValue: previousAssigneeId,
        newValue: assignee.id,
        metadata: { reason: data.reason, status: nextStatus },
      },
    });
    if (nextStatus !== ticket.status) {
      await tx.ticketActivity.create({
        data: {
          ticketId,
          actorId: actor.id,
          action: "ticket.status_changed",
          summary: `Status changed to ${nextStatus}.`,
          previousValue: ticket.status,
          newValue: nextStatus,
        },
      });
    }
    return row;
  });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: previousAssigneeId ? "ticket.reassigned" : "ticket.assigned",
    entityType: "ticket",
    entityId: ticketId,
    summary: `Assigned ${ticket.number} to ${assignee.name}.`,
    metadata: { assigneeId: assignee.id, reason: data.reason },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
  return updated;
}

export async function changeTicketStatus(actor: Actor, ticketId: string, input: unknown) {
  const data = parse(statusSchema, input, "Check the status change.");
  if (data.status === "RESOLVED") assertPermission(actor, "tickets.resolve");
  else if (data.status === "CLOSED") assertPermission(actor, "tickets.close");
  else if (data.status === "REOPENED") assertPermission(actor, "tickets.reopen");
  else if (data.status === "CANCELLED") assertPermission(actor, "tickets.cancel");
  else assertPermission(actor, "tickets.change_status");

  const ticket = await loadTicket(ticketId);
  await assertCanViewTicket(actor, ticket);

  if (!canTransition(ticket.status, data.status)) {
    throw new AppError(`Cannot move a ticket from ${ticket.status} to ${data.status}.`);
  }
  if (data.status === "RESOLVED" && !data.resolution) {
    throw new AppError("Enter the resolution before marking the ticket resolved.");
  }
  if (data.status === "CLOSED" && !ticket.resolution && !data.resolution) {
    throw new AppError("A closed ticket must have a resolution record.");
  }
  if (data.status === "REOPENED" && !data.reason) {
    throw new AppError("Enter a reason before reopening the ticket.");
  }
  if (data.status === "CANCELLED" && !data.reason) {
    throw new AppError("Enter a cancellation reason.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: data.status,
        resolution: data.resolution ?? ticket.resolution,
        resolvedAt: data.status === "RESOLVED" ? new Date() : ticket.resolvedAt,
        closedAt: data.status === "CLOSED" ? new Date() : ticket.closedAt,
        cancelledAt: data.status === "CANCELLED" ? new Date() : ticket.cancelledAt,
        cancellationReason: data.status === "CANCELLED" ? data.reason : ticket.cancellationReason,
        reopenReason: data.status === "REOPENED" ? data.reason : ticket.reopenReason,
        updatedById: actor.id,
      },
    });
    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorId: actor.id,
        action: "ticket.status_changed",
        summary: `Status changed to ${data.status}.`,
        previousValue: ticket.status,
        newValue: data.status,
        metadata: { reason: data.reason, resolution: data.resolution ? "[set]" : undefined },
      },
    });
    return row;
  });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: "ticket.status_changed",
    entityType: "ticket",
    entityId: ticketId,
    summary: `${ticket.number} moved to ${data.status}.`,
    metadata: { from: ticket.status, to: data.status },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
  return updated;
}

export async function changeTicketPriority(actor: Actor, ticketId: string, input: unknown) {
  assertPermission(actor, "tickets.change_priority");
  const data = parse(prioritySchema, input, "Check the priority change.");
  const ticket = await loadTicket(ticketId);
  await assertCanViewTicket(actor, ticket);
  if (ticket.priority === data.priority) throw new AppError("Choose a different priority.");

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        priority: data.priority as TicketPriority,
        priorityOverrideReason: data.reason,
        updatedById: actor.id,
      },
    });
    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorId: actor.id,
        action: "ticket.priority_changed",
        summary: `Priority changed to ${data.priority}.`,
        previousValue: ticket.priority,
        newValue: data.priority,
        metadata: { reason: data.reason },
      },
    });
    return row;
  });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: "ticket.priority_changed",
    entityType: "ticket",
    entityId: ticketId,
    summary: `${ticket.number} priority set to ${data.priority}.`,
    metadata: { from: ticket.priority, to: data.priority, reason: data.reason },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
  return updated;
}

export async function addTicketComment(actor: Actor, ticketId: string, input: unknown) {
  const data = parse(commentSchema, input, "Check the comment.");
  if (data.visibility === "INTERNAL") assertPermission(actor, "tickets.internal_note");
  else assertPermission(actor, "tickets.comment");

  const ticket = await loadTicket(ticketId);
  await assertCanViewTicket(actor, ticket);

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.ticketComment.create({
      data: {
        ticketId,
        authorId: actor.id,
        visibility: data.visibility,
        body: data.body,
      },
    });
    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorId: actor.id,
        action: data.visibility === "INTERNAL" ? "ticket.internal_note_added" : "ticket.comment_added",
        summary: data.visibility === "INTERNAL" ? "Internal note added." : "Public comment added.",
        metadata: { commentId: created.id },
      },
    });
    await tx.ticket.update({
      where: { id: ticketId },
      data: { updatedById: actor.id },
    });
    return created;
  });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: data.visibility === "INTERNAL" ? "ticket.internal_note_added" : "ticket.comment_added",
    entityType: "ticket",
    entityId: ticketId,
    summary: `${data.visibility === "INTERNAL" ? "Internal note" : "Comment"} added on ${ticket.number}.`,
    metadata: { commentId: comment.id, visibility: data.visibility },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });
  return comment;
}

export async function listTicketComments(actor: Actor, ticketId: string) {
  const ticket = await loadTicket(ticketId);
  await assertCanViewTicket(actor, ticket);
  const includeInternal = canReadInternalNotes(actor);
  return prisma.ticketComment.findMany({
    where: {
      ticketId,
      ...(includeInternal ? {} : { visibility: "PUBLIC" }),
    },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function recalculatePriority(impact: Parameters<typeof resolvePriority>[0], urgency: Parameters<typeof resolvePriority>[1]) {
  return resolvePriority(impact, urgency);
}
