import Link from "next/link";
import { RoleForm } from "@/components/admin/role-form";
import { Panel } from "@/components/admin/page";
import { createRoleAction } from "@/server/actions/role-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { permissionCatalog } from "@/server/services/role-service";

export default async function NewRolePage() {
  await requirePagePermission("roles.manage");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/roles" className="text-sm text-blue-800">
        Back to roles
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">New role</h1>
      <Panel>
        <RoleForm action={createRoleAction} catalog={permissionCatalog()} />
      </Panel>
    </div>
  );
}
