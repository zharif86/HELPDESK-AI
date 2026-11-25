import Link from "next/link";
import { EmptyState, Flash, PageHeader, Panel } from "@/components/admin/page";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { inputClass } from "@/components/admin/styles";
import { firstParam, hrefWith, pageParam } from "@/lib/query";
import { requirePagePermission } from "@/server/auth/current-user";
import { listDepartments } from "@/server/services/department-service";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requirePagePermission("departments.read");
  const params = await searchParams;
  const q = firstParam(params.q) ?? "";
  const page = pageParam(params.page);
  const result = await listDepartments(actor, { q, page, includeInactive: true });
  const canManage = user.permissions.includes("departments.manage");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Departments"
        description={
          canManage
            ? "Organisation structure used by accounts and locations."
            : "Departments you are allowed to view."
        }
        action={canManage ? { href: "/admin/departments/new", label: "New department" } : undefined}
      />
      <Flash notice={firstParam(params.notice)} />
      <Panel>
        <form method="get" className="flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="Name or code" className={`${inputClass} max-w-sm`} />
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm" type="submit">
            Search
          </button>
        </form>
      </Panel>
      {result.items.length === 0 ? (
        <EmptyState>No departments match this search.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Head</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/departments/${item.id}`} className="font-medium text-blue-800">
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500">{item.code}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.parent?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.head?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={item.isActive} />
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
        hrefFor={(nextPage) => hrefWith("/admin/departments", { q }, nextPage)}
      />
    </div>
  );
}
