import type { TicketImpact, TicketPriority, TicketUrgency } from "@/generated/prisma/client";

export const DEFAULT_PRIORITY_MATRIX: Array<{
  impact: TicketImpact;
  urgency: TicketUrgency;
  priority: TicketPriority;
}> = [
  { impact: "HIGH", urgency: "HIGH", priority: "CRITICAL" },
  { impact: "HIGH", urgency: "MEDIUM", priority: "HIGH" },
  { impact: "HIGH", urgency: "LOW", priority: "MEDIUM" },
  { impact: "MEDIUM", urgency: "HIGH", priority: "HIGH" },
  { impact: "MEDIUM", urgency: "MEDIUM", priority: "MEDIUM" },
  { impact: "MEDIUM", urgency: "LOW", priority: "LOW" },
  { impact: "LOW", urgency: "HIGH", priority: "MEDIUM" },
  { impact: "LOW", urgency: "MEDIUM", priority: "LOW" },
  { impact: "LOW", urgency: "LOW", priority: "LOW" },
];
