import Link from "next/link";
import { PriorityBadge, TicketStatusBadge } from "@/components/tickets/badges";
import { formatDateTime } from "@/lib/format";
import { noticeMessage } from "@/lib/notices";
import { requirePagePermission } from "@/server/auth/current-user";
import { getDashboard } from "@/server/services/dashboard-service";
import { getHelpdeskDashboard } from "@/server/services/helpdesk-dashboard-service";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { user, actor } = await requirePagePermission("dashboard.view");
  const [data, helpdesk] = await Promise.all([getDashboard(actor), getHelpdeskDashboard(actor)]);
  const notice = noticeMessage((await searchParams).notice);
  const maxRole = Math.max(1, ...data.roleCounts.map((role) => role.count));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {user.name}
          {user.department ? ` · ${user.department.name}` : ""}. Figures below come from the current database.
        </p>
      </div>

      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      ) : null}

      {helpdesk ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Helpdesk</h2>
            <Link href="/tickets" className="text-sm text-blue-800">
              Open tickets
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Tickets in scope" value={helpdesk.total} detail="Visible to this account" />
            <Stat label="Open / active" value={helpdesk.openLike} detail="New through escalated" />
            <Stat label="Pending" value={helpdesk.pending} detail="Waiting on user or vendor" />
            <Stat label="Critical" value={helpdesk.critical} detail="Highest priority" highlight={helpdesk.critical > 0} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Assigned to me" value={helpdesk.assignedToMe} detail="Current workload" />
            <Stat label="Unassigned" value={helpdesk.unassigned} detail="Queue depth" />
            <Stat label="Resolved" value={helpdesk.resolved} detail="Awaiting closure" />
            <Stat label="Closed" value={helpdesk.closed} detail="Completed incidents" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">By priority</h3>
              <ul className="mt-4 space-y-2">
                {helpdesk.byPriority.map((row) => (
                  <li key={row.priority} className="flex items-center justify-between text-sm">
                    <PriorityBadge priority={row.priority} />
                    <span className="font-medium text-slate-900">{row.count}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Recently updated</h3>
              {helpdesk.recent.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No tickets yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {helpdesk.recent.map((ticket) => (
                    <li key={ticket.id} className="py-3 first:pt-0 last:pb-0">
                      <Link href={`/tickets/${ticket.id}`} className="text-sm font-medium text-blue-800">
                        {ticket.number}
                      </Link>
                      <p className="text-sm text-slate-700">{ticket.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <TicketStatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        <span className="text-xs text-slate-500">{formatDateTime(ticket.updatedAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
          {helpdesk.technicianWorkload.length > 0 ? (
            <article className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Technician workload</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {helpdesk.technicianWorkload.map((item) => (
                  <li key={item.id} className="rounded-md border border-slate-100 px-3 py-3 text-sm">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.specialisation ?? "No specialisation set"}</p>
                    <p className="mt-2 text-slate-700">{item.openTickets} open tickets</p>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Accounts" value={data.userCount} detail="People with an account" />
        <Stat label="Active accounts" value={data.activeUserCount} detail="Able to sign in" />
        <Stat label="Departments" value={data.departmentCount} detail="Active departments" />
        <Stat label="Locations" value={data.locationCount} detail="Active locations" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Accounts by role</h2>
          {data.roleCounts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Role totals are hidden for this account.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.roleCounts.map((role) => (
                <li key={role.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{role.name}</span>
                    <span className="font-medium text-slate-900">{role.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-[#1d4ed8]"
                      style={{ width: `${Math.max(4, (role.count / maxRole) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
          {data.recentAudit.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No audit records are visible for this account yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.recentAudit.map((entry) => (
                <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-slate-900">{entry.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {entry.actor?.name ?? "System"} · {formatDateTime(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Your account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Email" value={user.email} />
          <Field label="Role" value={user.roles.map((role) => role.name).join(", ") || "—"} />
          <Field label="Department" value={user.department?.name ?? "Not assigned"} />
          <Field label="Location" value={user.location?.name ?? "Not assigned"} />
        </dl>
      </section>

      <p className="text-sm leading-6 text-slate-500">
        SLA compliance and AI resolution rates are not on this screen. Those figures arrive with later modules.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  highlight = false,
}: {
  label: string;
  value: number | null;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <article className={`rounded-lg border p-5 ${highlight ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${highlight ? "text-red-900" : "text-slate-900"}`}>
        {value === null ? "—" : value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}
