import "server-only";

import { randomBytes } from "node:crypto";
import { assertPermission } from "@/server/access/guards";
import type { Actor } from "@/server/access/types";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { AppError, ForbiddenError } from "@/server/errors";
import { assertCanViewTicket, canReadInternalNotes } from "@/server/tickets/access";
import { getAttachmentStorage } from "@/server/storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string[]> = {
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt", "log"],
};

function extensionFor(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1)! : "";
}

function sniffMime(bytes: Uint8Array, fallback: string) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  if (fallback === "text/plain" || fallback === "text/plain; charset=utf-8") return "text/plain";
  return fallback.split(";")[0]?.trim() ?? fallback;
}

export async function uploadTicketAttachment(
  actor: Actor,
  ticketId: string,
  file: File,
  options?: { isInternal?: boolean },
) {
  assertPermission(actor, "tickets.comment");
  if (options?.isInternal) assertPermission(actor, "tickets.internal_note");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError("Ticket not found.");
  await assertCanViewTicket(actor, ticket);

  if (!file || typeof file.arrayBuffer !== "function") {
    throw new AppError("Choose a file to upload.");
  }
  if (file.size <= 0) throw new AppError("The file is empty.");
  if (file.size > MAX_BYTES) throw new AppError("Files must be 5 MB or smaller.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffMime(bytes, file.type || "application/octet-stream");
  const allowedExt = ALLOWED[mimeType];
  if (!allowedExt) throw new AppError("That file type is not allowed.");
  const extension = extensionFor(file.name);
  if (!allowedExt.includes(extension)) {
    throw new AppError("The file extension does not match an allowed type.");
  }

  const storageKey = `tickets/${ticketId}/${randomBytes(16).toString("hex")}.${extension}`;
  const storage = getAttachmentStorage();
  await storage.put({ storageKey, bytes, mimeType });

  const attachment = await prisma.$transaction(async (tx) => {
    const created = await tx.ticketAttachment.create({
      data: {
        ticketId,
        uploadedById: actor.id,
        originalName: file.name.slice(0, 180),
        storageKey,
        mimeType,
        sizeBytes: bytes.byteLength,
        isInternal: Boolean(options?.isInternal),
      },
    });
    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorId: actor.id,
        action: "ticket.attachment_uploaded",
        summary: `Attachment uploaded: ${created.originalName}.`,
        metadata: { attachmentId: created.id, mimeType, isInternal: created.isInternal },
      },
    });
    return created;
  });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: "ticket.attachment_uploaded",
    entityType: "ticket",
    entityId: ticketId,
    summary: `Attachment added to ${ticket.number}.`,
    metadata: { attachmentId: attachment.id, mimeType, sizeBytes: attachment.sizeBytes },
    ipAddress: actor.ipAddress,
    userAgent: actor.userAgent,
  });

  return attachment;
}

export async function listTicketAttachments(actor: Actor, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError("Ticket not found.");
  await assertCanViewTicket(actor, ticket);
  const includeInternal = canReadInternalNotes(actor);
  return prisma.ticketAttachment.findMany({
    where: {
      ticketId,
      ...(includeInternal ? {} : { isInternal: false }),
    },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });
}

export async function openTicketAttachment(actor: Actor, attachmentId: string) {
  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id: attachmentId },
    include: { ticket: true },
  });
  if (!attachment) throw new AppError("Attachment not found.");
  await assertCanViewTicket(actor, attachment.ticket);
  if (attachment.isInternal && !canReadInternalNotes(actor)) {
    throw new ForbiddenError("You cannot download this attachment.");
  }
  const opened = await getAttachmentStorage().open(attachment.storageKey);
  if (!opened.exists) throw new AppError("The file is no longer available.");
  return { attachment, absolutePath: opened.absolutePath };
}

export const ATTACHMENT_LIMITS = {
  maxBytes: MAX_BYTES,
  allowedMimeTypes: Object.keys(ALLOWED),
};
