import Link from "next/link";
import { EmptyState, Flash, PageHeader, Panel } from "@/components/admin/page";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { inputClass } from "@/components/admin/styles";
import { firstParam, hrefWith, pageParam } from "@/lib/query";
import { requirePagePermission } from "@/server/auth/current-user";
import { listLocations } from "@/server/services/location-service";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requirePagePermission("locations.read");
  const params = await searchParams;
  const q = firstParam(params.q) ?? "";
  const page = pageParam(params.page);
  const result = await listLocations(actor, { q, page });
  const canManage = user.permissions.includes("locations.manage");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Locations"
        description="Buildings, floors and rooms that can be linked to an account."
        action={canManage ? { href: "/admin/locations/new", label: "New location" } : undefined}
      />
      <Flash notice={firstParam(params.notice)} />
      <Panel>
        <form method="get" className="flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="Name, code, or building" className={`${inputClass} max-w-sm`} />
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm" type="submit">
            Search
          </button>
        </form>
      </Panel>
      {result.items.length === 0 ? (
        <EmptyState>No locations match this search.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Place</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/locations/${item.id}`} className="font-medium text-blue-800">
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500">{item.code}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {[item.building, item.floor ? `Floor ${item.floor}` : null, item.room].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.department?.name ?? "—"}</td>
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
        hrefFor={(nextPage) => hrefWith("/admin/locations", { q }, nextPage)}
      />
    </div>
  );
}
