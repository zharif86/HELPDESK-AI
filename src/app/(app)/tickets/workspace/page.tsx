import Link from "next/link";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page";
import { PriorityBadge, TicketStatusBadge } from "@/components/tickets/badges";
import { requireAnyPagePermission } from "@/server/auth/current-user";
import { listTickets } from "@/server/services/ticket-service";

export default async function TechnicianWorkspacePage() {
  const { actor } = await requireAnyPagePermission(["tickets.update", "tickets.read", "tickets.assign"]);
  const [assigned, unassigned, critical] = await Promise.all([
    listTickets(actor, { assigneeId: actor.id, page: 1 }),
    listTickets(actor, { assigneeId: "unassigned", page: 1 }),
    listTickets(actor, { priority: "CRITICAL", page: 1 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Technician workspace"
        description="Assigned work, the unassigned queue, and critical incidents in your scope."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Panel>
          <p className="text-sm text-slate-500">Assigned to me</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{assigned.total}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-slate-500">Unassigned queue</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{unassigned.total}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-slate-500">Critical in scope</p>
          <p className="mt-2 text-3xl font-semibold text-red-800">{critical.total}</p>
        </Panel>
      </section>

      <TicketTable title="My assigned tickets" items={assigned.items} empty="Nothing assigned to you." />
      <TicketTable title="Unassigned queue" items={unassigned.items} empty="Queue is empty." />
    </div>
  );
}

function TicketTable({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{
    id: string;
    number: string;
    title: string;
    priority: string;
    status: string;
    requester: { name: string };
  }>;
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
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
              {items.map((item) => (
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
    </section>
  );
}
