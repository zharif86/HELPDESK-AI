import Link from "next/link";
import { Panel } from "@/components/admin/page";
import { UserForm } from "@/components/admin/user-form";
import { createUserAction } from "@/server/actions/user-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { listDepartmentOptions } from "@/server/services/department-service";
import { listLocationOptions } from "@/server/services/location-service";
import { listRoleOptions } from "@/server/services/user-service";

export default async function NewUserPage() {
  const { actor } = await requirePagePermission("users.create");
  const [roles, departments, locations] = await Promise.all([
    listRoleOptions(actor),
    listDepartmentOptions(actor),
    listLocationOptions(actor),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/users" className="text-sm text-blue-800">
        Back to users
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">New user</h1>
      <Panel>
        <UserForm action={createUserAction} roles={roles} departments={departments} locations={locations} requirePassword />
      </Panel>
    </div>
  );
}
