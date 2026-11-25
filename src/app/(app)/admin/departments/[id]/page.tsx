import Link from "next/link";
import { notFound } from "next/navigation";
import { DepartmentForm } from "@/components/admin/org-forms";
import { Flash, Panel } from "@/components/admin/page";
import { firstParam } from "@/lib/query";
import { updateDepartmentAction } from "@/server/actions/department-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { getDepartment, listActiveUsersForHead, listDepartmentOptions } from "@/server/services/department-service";

export default async function DepartmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, user } = await requirePagePermission("departments.read");
  const { id } = await params;
  const department = await getDepartment(actor, id);
  if (!department) notFound();
  const canManage = user.permissions.includes("departments.manage");
  const [parents, heads] = canManage
    ? await Promise.all([listDepartmentOptions(actor), listActiveUsersForHead(actor)])
    : [[], []];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/departments" className="text-sm text-blue-800">
        Back to departments
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">{department.name}</h1>
      <Flash notice={firstParam((await searchParams).notice)} />
      <Panel>
        {canManage ? (
          <DepartmentForm
            action={updateDepartmentAction.bind(null, department.id)}
            parents={parents.filter((parent) => parent.id !== department.id)}
            heads={heads}
            department={department}
          />
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-slate-500">Code</dt>
              <dd className="mt-1 text-slate-900">{department.code}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Parent</dt>
              <dd className="mt-1 text-slate-900">{department.parent?.name ?? "No parent"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Head</dt>
              <dd className="mt-1 text-slate-900">{department.head?.name ?? "No head assigned"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-1 text-slate-900">{department.isActive ? "Active" : "Inactive"}</dd>
            </div>
          </dl>
        )}
      </Panel>
    </div>
  );
}
