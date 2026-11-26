import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageHeader, Panel } from "@/components/admin/page";
import { CategoryForm } from "@/components/tickets/category-form";
import { firstParam } from "@/lib/query";
import { updateCategoryAction } from "@/server/actions/category-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { getCategory, listCategories } from "@/server/services/category-service";

export default async function TicketCategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { actor } = await requirePagePermission("ticket_categories.manage");
  const [category, categories] = await Promise.all([getCategory(actor, id), listCategories(actor)]);
  if (!category) notFound();
  const parents = categories.filter((item) => !item.parentId && item.id !== category.id);
  const referenced = category._count.tickets + category._count.subTickets;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title={category.name} description={`Code ${category.code}`} />
        <Link href="/admin/ticket-categories" className="text-sm text-blue-800">
          Back
        </Link>
      </div>
      <Flash notice={firstParam((await searchParams).notice)} />
      {referenced > 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This category is referenced by {referenced} ticket{referenced === 1 ? "" : "s"}. Deactivate it instead of
          removing it.
        </p>
      ) : null}
      <Panel>
        <CategoryForm
          action={updateCategoryAction.bind(null, category.id)}
          parents={parents}
          category={{
            code: category.code,
            name: category.name,
            description: category.description,
            parentId: category.parentId,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
          }}
        />
      </Panel>
    </div>
  );
}
