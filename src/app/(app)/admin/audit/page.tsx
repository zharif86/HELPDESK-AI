import { EmptyState, PageHeader, Panel } from "@/components/admin/page";
import { Pagination } from "@/components/admin/pagination";
import { inputClass } from "@/components/admin/styles";
import { formatDateTime } from "@/lib/format";
import { firstParam, hrefWith, pageParam } from "@/lib/query";
import { requirePagePermission } from "@/server/auth/current-user";
import { listAuditLogs } from "@/server/services/audit-service";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor } = await requirePagePermission("audit.read");
  const params = await searchParams;
  const q = firstParam(params.q) ?? "";
  const action = firstParam(params.action) ?? "";
  const from = firstParam(params.from) ?? "";
  const to = firstParam(params.to) ?? "";
  const page = pageParam(params.page);
  const result = await listAuditLogs(actor, { q, action, from, to, page });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Audit log"
        description="Administrative and sign-in activity. These records are append-only and cannot be edited here."
      />
      <Panel>
        <form method="get" className="grid gap-3 md:grid-cols-4">
          <input name="q" defaultValue={q} placeholder="Summary or person" className={inputClass} />
          <select name="action" defaultValue={action} className={inputClass}>
            <option value="">Any action</option>
            {result.actions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input name="from" type="date" defaultValue={from} className={inputClass} aria-label="From date" />
          <input name="to" type="date" defaultValue={to} className={inputClass} aria-label="To date" />
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm md:w-fit" type="submit">
            Apply filters
          </button>
        </form>
      </Panel>
      {result.items.length === 0 ? (
        <EmptyState>No audit records match these filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">Activity</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-700">{item.actor?.name ?? "System"}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900">{item.summary}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.action}
                      {item.entityType ? ` · ${item.entityType}` : ""}
                    </p>
                    {item.metadata ? (
                      <pre className="mt-2 max-w-xl overflow-x-auto whitespace-pre-wrap text-xs text-slate-500">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </td>
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
        hrefFor={(nextPage) => hrefWith("/admin/audit", { q, action, from, to }, nextPage)}
      />
    </div>
  );
}
