import type { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/db";
import { redact } from "@/server/redact";

type AuditWriter = Pick<DatabaseClient, "auditLog">;

export async function writeAudit(
  db: AuditWriter,
  entry: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    summary: string;
    metadata?: unknown;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const metadata = redact(entry.metadata);
  await db.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      summary: entry.summary,
      metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent?.slice(0, 255) ?? null,
    },
  });
}
