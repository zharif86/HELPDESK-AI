import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, Panel } from "@/components/admin/page";
import { PasswordResetForm, StatusForm, UserForm } from "@/components/admin/user-form";
import { formatDateTime } from "@/lib/format";
import { firstParam } from "@/lib/query";
import { resetPasswordAction, setUserStatusAction, updateUserAction } from "@/server/actions/user-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { listAccountHistory } from "@/server/services/audit-service";
import { listDepartmentOptions } from "@/server/services/department-service";
import { listLocationOptions } from "@/server/services/location-service";
import { getUser, listRoleOptions } from "@/server/services/user-service";

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user: current } = await requirePagePermission("users.read");
  const { id } = await params;
  const query = await searchParams;
  const [account, roles, departments, locations, history] = await Promise.all([
    getUser(actor, id),
    listRoleOptions(actor),
    listDepartmentOptions(actor),
    listLocationOptions(actor),
    listAccountHistory(actor, id),
  ]);
  if (!account) notFound();
  const canUpdate = current.permissions.includes("users.update");
  const canDeactivate = current.permissions.includes("users.deactivate");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/users" className="text-sm text-blue-800">
        Back to users
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{account.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Last sign-in {formatDateTime(account.lastLoginAt)}
          {account.mustChangePassword ? " · Password change required" : ""}
        </p>
      </div>
      <Flash notice={firstParam(query.notice)} error={firstParam(query.error)} />
      <Panel>
        {canUpdate ? (
          <UserForm
            action={updateUserAction.bind(null, account.id)}
            roles={roles}
            departments={departments}
            locations={locations}
            user={{
              name: account.name,
              email: account.email,
              staffId: account.staffId,
              phone: account.phone,
              jobTitle: account.jobTitle,
              departmentId: account.department?.id,
              locationId: account.location?.id,
              roleIds: account.roles.map((role) => role.role.id),
            }}
          />
        ) : (
          <p className="text-sm text-slate-600">You can view this account, but you cannot change it.</p>
        )}
      </Panel>
      {canDeactivate ? (
        <Panel>
          <h2 className="text-sm font-semibold text-slate-900">Account status</h2>
          <p className="mt-1 text-sm text-slate-600">Deactivation signs the person out and blocks the next sign-in.</p>
          <div className="mt-4">
            <StatusForm
              action={setUserStatusAction.bind(null, account.id, account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
              label={account.status === "ACTIVE" ? "Deactivate account" : "Reactivate account"}
              tone={account.status === "ACTIVE" ? "danger" : "secondary"}
              message={
                account.status === "ACTIVE"
                  ? `Deactivate ${account.name}? Their current sessions will end.`
                  : `Reactivate ${account.name}?`
              }
            />
          </div>
        </Panel>
      ) : null}
      {canUpdate ? (
        <Panel>
          <h2 className="text-sm font-semibold text-slate-900">Reset password</h2>
          <div className="mt-4">
            <PasswordResetForm action={resetPasswordAction.bind(null, account.id)} />
          </div>
        </Panel>
      ) : null}
      <Panel>
        <h2 className="text-sm font-semibold text-slate-900">Account history</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No recorded changes for this account yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {history.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-sm text-slate-900">{entry.summary}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.actor?.name ?? "System"} · {formatDateTime(entry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
