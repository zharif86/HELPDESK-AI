import Link from "next/link";
import { LocationForm } from "@/components/admin/org-forms";
import { Panel } from "@/components/admin/page";
import { createLocationAction } from "@/server/actions/location-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { listDepartmentOptions } from "@/server/services/department-service";

export default async function NewLocationPage() {
  const { actor } = await requirePagePermission("locations.manage");
  const departments = await listDepartmentOptions(actor);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/locations" className="text-sm text-blue-800">
        Back to locations
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">New location</h1>
      <Panel>
        <LocationForm action={createLocationAction} departments={departments} />
      </Panel>
    </div>
  );
}
