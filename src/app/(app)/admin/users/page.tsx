import Link from "next/link";
import { EmptyState, Flash, PageHeader, Panel } from "@/components/admin/page";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { inputClass } from "@/components/admin/styles";
import { firstParam, hrefWith, pageParam } from "@/lib/query";
import { requirePagePermission } from "@/server/auth/current-user";
import { listDepartmentOptions } from "@/server/services/department-service";
import { listRoleOptions, listUsers } from "@/server/services/user-service";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requirePagePermission("users.read");
  const params = await searchParams;
  const q = firstParam(params.q) ?? "";
  const status = firstParam(params.status) ?? "";
  const departmentId = firstParam(params.departmentId) ?? "";
  const roleId = firstParam(params.roleId) ?? "";
  const page = pageParam(params.page);
  const [result, departments, roles] = await Promise.all([
    listUsers(actor, { q, status, departmentId, roleId, page }),
    listDepartmentOptions(actor),
    listRoleOptions(actor),
  ]);
  const filters = { q, status, departmentId, roleId };
  const canCreate = user.permissions.includes("users.create");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Users"
        description="Accounts that can sign in to the helpdesk."
        action={canCreate ? { href: "/admin/users/new", label: "New user" } : undefined}
      />
      <Flash notice={firstParam(params.notice)} error={firstParam(params.error)} />
      <Panel>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <input name="q" defaultValue={q} placeholder="Name, email, or staff ID" className={inputClass} />
          <select name="status" defaultValue={status} className={inputClass}>
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select name="departmentId" defaultValue={departmentId} className={inputClass}>
            <option value="">Any department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select name="roleId" defaultValue={roleId} className={inputClass}>
            <option value="">Any role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm md:col-span-4 md:w-fit" type="submit">
            Apply filters
          </button>
        </form>
      </Panel>
      {result.items.length === 0 ? (
        <EmptyState>No accounts match these filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${item.id}`} className="font-medium text-blue-800">
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.roles.map((role) => role.role.name).join(", ")}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={item.status === "ACTIVE"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        hrefFor={(nextPage) => hrefWith("/admin/users", filters, nextPage)}
      />
    </div>
  );
}
