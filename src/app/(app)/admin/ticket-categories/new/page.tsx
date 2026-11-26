import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/page";
import { CategoryForm } from "@/components/tickets/category-form";
import { createCategoryAction } from "@/server/actions/category-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { listCategories } from "@/server/services/category-service";

export default async function NewTicketCategoryPage() {
  const { actor } = await requirePagePermission("ticket_categories.manage");
  const categories = await listCategories(actor);
  const parents = categories.filter((item) => !item.parentId);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="New category" description="Add a parent category or subcategory." />
        <Link href="/admin/ticket-categories" className="text-sm text-blue-800">
          Back
        </Link>
      </div>
      <Panel>
        <CategoryForm action={createCategoryAction} parents={parents} />
      </Panel>
    </div>
  );
}
