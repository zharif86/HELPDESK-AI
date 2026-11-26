import Link from "next/link";
import { EmptyState, Flash, PageHeader } from "@/components/admin/page";
import { StatusBadge } from "@/components/admin/status-badge";
import { firstParam } from "@/lib/query";
import { requirePagePermission } from "@/server/auth/current-user";
import { listCategories } from "@/server/services/category-service";

export default async function TicketCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor } = await requirePagePermission("ticket_categories.manage");
  const categories = await listCategories(actor);
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Ticket categories"
        description="Incident categories and subcategories. Prefer deactivation over deletion when tickets already reference a category."
        action={{ href: "/admin/ticket-categories/new", label: "New category" }}
      />
      <Flash notice={firstParam(params.notice)} />
      {categories.length === 0 ? (
        <EmptyState>No categories yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/ticket-categories/${item.id}`} className="font-medium text-blue-800">
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500">{item.code}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.parent?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item._count.tickets + item._count.subTickets}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={item.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
