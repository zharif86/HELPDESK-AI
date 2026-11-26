import "server-only";

import type { TicketImpact, TicketPriority, TicketUrgency } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { DEFAULT_PRIORITY_MATRIX } from "@/server/tickets/priority-matrix";

export async function resolvePriority(impact: TicketImpact, urgency: TicketUrgency): Promise<TicketPriority> {
  const rule = await prisma.ticketPriorityRule.findUnique({
    where: { impact_urgency: { impact, urgency } },
  });
  if (rule) return rule.priority;
  const fallback = DEFAULT_PRIORITY_MATRIX.find(
    (row) => row.impact === impact && row.urgency === urgency,
  );
  if (!fallback) throw new AppError("No priority rule matches that impact and urgency.");
  return fallback.priority;
}

export async function listPriorityRules() {
  return prisma.ticketPriorityRule.findMany({
    orderBy: [{ impact: "asc" }, { urgency: "asc" }],
  });
}
