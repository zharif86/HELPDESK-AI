import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteRoleForm, RoleForm } from "@/components/admin/role-form";
import { Flash, Panel } from "@/components/admin/page";
import { firstParam } from "@/lib/query";
import { LOCKED_SYSTEM_ADMIN_PERMISSIONS } from "@/server/access/catalog";
import { deleteRoleAction, updateRoleAction } from "@/server/actions/role-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { getRole, permissionCatalog } from "@/server/services/role-service";

export default async function RoleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requirePagePermission("roles.read");
  const { id } = await params;
  const role = await getRole(actor, id);
  if (!role) notFound();
  const canManage = user.permissions.includes("roles.manage");
  const permissions = role.permissions.map((grant) => grant.permission.key);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/roles" className="text-sm text-blue-800">
        Back to roles
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{role.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {role._count.users} accounts use this role. {role.isSystem ? "System roles cannot be deleted." : ""}
        </p>
      </div>
      <Flash notice={firstParam((await searchParams).notice)} />
      <Panel>
        {canManage ? (
          <RoleForm
            action={updateRoleAction.bind(null, role.id)}
            catalog={permissionCatalog()}
            locked={role.key === "SYSTEM_ADMIN" ? LOCKED_SYSTEM_ADMIN_PERMISSIONS : []}
            role={{ key: role.key, name: role.name, description: role.description, permissions }}
          />
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {role.permissions.map((grant) => (
              <li key={grant.permission.key}>
                <span className="font-medium">{grant.permission.module}</span> · {grant.permission.description}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {canManage && !role.isSystem ? (
        <Panel>
          <DeleteRoleForm action={deleteRoleAction.bind(null, role.id)} />
        </Panel>
      ) : null}
    </div>
  );
}
