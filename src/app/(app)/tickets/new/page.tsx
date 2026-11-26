import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/page";
import { TicketForm } from "@/components/tickets/ticket-form";
import { createTicketAction } from "@/server/actions/ticket-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { listCategories } from "@/server/services/category-service";
import { listLocationOptions } from "@/server/services/location-service";

export default async function NewTicketPage() {
  const { actor } = await requirePagePermission("tickets.create");
  const [categories, locations] = await Promise.all([
    listCategories(actor, { activeOnly: true }),
    listLocationOptions(actor),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <PageHeader
          title="New ticket"
          description="Describe the incident. Priority is calculated from impact and urgency."
        />
        <Link href="/tickets" className="text-sm text-blue-800">
          Back to tickets
        </Link>
      </div>
      <Panel>
        <TicketForm
          action={createTicketAction}
          categories={categories.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            parentId: item.parentId,
          }))}
          locations={locations}
        />
      </Panel>
    </div>
  );
}
