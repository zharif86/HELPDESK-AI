import { formatDateTime } from "@/lib/format";
import { noticeMessage } from "@/lib/notices";
import { requirePagePermission } from "@/server/auth/current-user";
import { getDashboard } from "@/server/services/dashboard-service";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { user, actor } = await requirePagePermission("dashboard.view");
  const data = await getDashboard(actor);
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
        Incident totals, SLA compliance, and AI resolution rates are not on this screen. Those figures will be added
        when ticketing and the assistant write their own records.
      </p>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: number | null; detail: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value === null ? "—" : value}</p>
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
