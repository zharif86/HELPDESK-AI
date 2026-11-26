import { priorityBadgeClass, statusBadgeClass, statusLabel } from "@/lib/tickets";

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${priorityBadgeClass(priority)}`}>
      {priority}
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${statusBadgeClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
