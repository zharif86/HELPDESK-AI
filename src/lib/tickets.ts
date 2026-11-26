import type { TicketPriority, TicketStatus } from "@/generated/prisma/client";

export const TICKET_STATUSES: TicketStatus[] = [
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
];

export const TICKET_PRIORITIES: TicketPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-100 text-red-900 ring-1 ring-red-300";
    case "HIGH":
      return "bg-orange-100 text-orange-900 ring-1 ring-orange-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "NEW":
    case "OPEN":
      return "bg-sky-50 text-sky-900 ring-1 ring-sky-200";
    case "ASSIGNED":
    case "IN_PROGRESS":
    case "REOPENED":
      return "bg-blue-50 text-blue-900 ring-1 ring-blue-200";
    case "PENDING_USER":
    case "PENDING_VENDOR":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    case "ESCALATED":
    case "CRITICAL":
      return "bg-red-50 text-red-900 ring-1 ring-red-200";
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}
