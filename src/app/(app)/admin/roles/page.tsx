import Link from "next/link";
import { EmptyState, Flash, PageHeader } from "@/components/admin/page";
import { firstParam } from "@/lib/query";
import { requirePagePermission } from "@/server/auth/current-user";
import { listRoles } from "@/server/services/role-service";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requirePagePermission("roles.read");
  const roles = await listRoles(actor);
  const canManage = user.permissions.includes("roles.manage");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Roles"
        description="Permissions are checked on the server for every change."
        action={canManage ? { href: "/admin/roles/new", label: "New role" } : undefined}
      />
      <Flash notice={firstParam((await searchParams).notice)} />
      {roles.length === 0 ? (
        <EmptyState>No roles have been defined.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Link key={role.id} href={`/admin/roles/${role.id}`} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-slate-900">{role.name}</h2>
                <span className="text-xs text-slate-500">{role.isSystem ? "System" : "Custom"}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{role.description}</p>
              <p className="mt-3 text-xs text-slate-500">
                {role._count.users} accounts · {role.permissions.length} permissions
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
