import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/admin/page";
import { PriorityBadge, TicketStatusBadge } from "@/components/tickets/badges";
import { requireAnyPagePermission } from "@/server/auth/current-user";
import { listTickets } from "@/server/services/ticket-service";

export default async function UnassignedQueuePage() {
  const { actor } = await requireAnyPagePermission([
    "tickets.assign",
    "tickets.read",
    "tickets.update",
  ]);
  const result = await listTickets(actor, { assigneeId: "unassigned", page: 1 });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Unassigned queue"
        description="Tickets waiting for a technician. Assignment controls arrive in the next helpdesk step."
      />
      {result.items.length === 0 ? (
        <EmptyState>There are no unassigned tickets.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requester</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 last:border-0 ${item.priority === "CRITICAL" ? "bg-red-50/60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${item.id}`} className="font-medium text-blue-800">
                      {item.number}
                    </Link>
                    <p className="text-slate-700">{item.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.requester.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
