import Link from "next/link";
import { EmptyState, Flash, PageHeader, Panel } from "@/components/admin/page";
import { Pagination } from "@/components/admin/pagination";
import { inputClass } from "@/components/admin/styles";
import { PriorityBadge, TicketStatusBadge } from "@/components/tickets/badges";
import { firstParam, hrefWith, pageParam } from "@/lib/query";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/tickets";
import { requireAnyPagePermission } from "@/server/auth/current-user";
import { listCategories } from "@/server/services/category-service";
import { listDepartmentOptions } from "@/server/services/department-service";
import { listTickets } from "@/server/services/ticket-service";
import type { TicketStatus } from "@/generated/prisma/client";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requireAnyPagePermission([
    "tickets.read",
    "tickets.read_own",
    "tickets.read_department",
  ]);
  const params = await searchParams;
  const q = firstParam(params.q) ?? "";
  const status = (firstParam(params.status) ?? "") as TicketStatus | "";
  const priority = firstParam(params.priority) ?? "";
  const categoryId = firstParam(params.categoryId) ?? "";
  const departmentId = firstParam(params.departmentId) ?? "";
  const assigneeId = firstParam(params.assigneeId) ?? "";
  const from = firstParam(params.from) ?? "";
  const to = firstParam(params.to) ?? "";
  const page = pageParam(params.page);
  const canCreate = user.permissions.includes("tickets.create");
  const canFilterOrg =
    user.permissions.includes("tickets.read") || user.permissions.includes("tickets.read_department");

  const [result, categories, departments] = await Promise.all([
    listTickets(actor, { q, status, priority, categoryId, departmentId, assigneeId, from, to, page }),
    listCategories(actor, { activeOnly: true }),
    canFilterOrg ? listDepartmentOptions(actor) : Promise.resolve([]),
  ]);
  const filters = { q, status, priority, categoryId, departmentId, assigneeId, from, to };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Tickets"
        description="Incidents and support requests you are authorised to see."
        action={canCreate ? { href: "/tickets/new", label: "New ticket" } : undefined}
      />
      <Flash notice={firstParam(params.notice)} error={firstParam(params.error)} />
      <Panel>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <input name="q" defaultValue={q} placeholder="Number, title, or requester" className={`${inputClass} md:col-span-2`} />
          <select name="status" defaultValue={status} className={inputClass}>
            <option value="">Any status</option>
            {TICKET_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select name="priority" defaultValue={priority} className={inputClass}>
            <option value="">Any priority</option>
            {TICKET_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="categoryId" defaultValue={categoryId} className={inputClass}>
            <option value="">Any category</option>
            {categories
              .filter((item) => !item.parentId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {canFilterOrg ? (
            <select name="departmentId" defaultValue={departmentId} className={inputClass}>
              <option value="">Any department</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : null}
          <input type="date" name="from" defaultValue={from} className={inputClass} aria-label="From date" />
          <input type="date" name="to" defaultValue={to} className={inputClass} aria-label="To date" />
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm md:w-fit" type="submit">
            Apply filters
          </button>
        </form>
      </Panel>
      {result.items.length === 0 ? (
        <EmptyState>No tickets match these filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
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
                    <p className="text-xs text-slate-500">{item.category?.name ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <p>{item.requester.name}</p>
                    <p className="text-xs text-slate-500">{item.department?.name ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.assignee?.name ?? "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        hrefFor={(nextPage) => hrefWith("/tickets", filters, nextPage)}
      />
    </div>
  );
}
