import Link from "next/link";
import { notFound } from "next/navigation";
import { LocationForm } from "@/components/admin/org-forms";
import { Flash, Panel } from "@/components/admin/page";
import { firstParam } from "@/lib/query";
import { updateLocationAction } from "@/server/actions/location-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { listDepartmentOptions } from "@/server/services/department-service";
import { getLocation } from "@/server/services/location-service";

export default async function LocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requirePagePermission("locations.read");
  const { id } = await params;
  const location = await getLocation(actor, id);
  if (!location) notFound();
  const canManage = user.permissions.includes("locations.manage");
  const departments = canManage ? await listDepartmentOptions(actor) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/locations" className="text-sm text-blue-800">
        Back to locations
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">{location.name}</h1>
      <Flash notice={firstParam((await searchParams).notice)} />
      <Panel>
        {canManage ? (
          <LocationForm action={updateLocationAction.bind(null, location.id)} departments={departments} location={location} />
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Code</dt>
              <dd className="mt-1">{location.code}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Department</dt>
              <dd className="mt-1">{location.department?.name ?? "Not assigned"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Building</dt>
              <dd className="mt-1">{location.building ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Floor and room</dt>
              <dd className="mt-1">{[location.floor, location.room].filter(Boolean).join(" / ") || "—"}</dd>
            </div>
          </dl>
        )}
      </Panel>
    </div>
  );
}
