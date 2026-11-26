import "server-only";

import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Concurrency-safe INC-{year}-{sequence} using a per-year counter row. */
export async function nextTicketNumber(tx: Tx, at = new Date()) {
  const year = at.getUTCFullYear();
  const rows = await tx.$queryRaw<Array<{ last_value: number }>>`
    INSERT INTO ticket_number_sequences ("year", "last_value")
    VALUES (${year}, 1)
    ON CONFLICT ("year")
    DO UPDATE SET "last_value" = ticket_number_sequences."last_value" + 1
    RETURNING "last_value"
  `;
  const value = rows[0]?.last_value;
  if (!value || value < 1) {
    throw new Error("Ticket number sequence failed.");
  }
  return `INC-${year}-${String(value).padStart(6, "0")}`;
}
