import Link from "next/link";
import { DepartmentForm } from "@/components/admin/org-forms";
import { Panel } from "@/components/admin/page";
import { createDepartmentAction } from "@/server/actions/department-actions";
import { requirePagePermission } from "@/server/auth/current-user";
import { listActiveUsersForHead, listDepartmentOptions } from "@/server/services/department-service";

export default async function NewDepartmentPage() {
  const { actor } = await requirePagePermission("departments.manage");
  const [parents, heads] = await Promise.all([listDepartmentOptions(actor), listActiveUsersForHead(actor)]);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/departments" className="text-sm text-blue-800">
        Back to departments
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">New department</h1>
      <Panel>
        <DepartmentForm action={createDepartmentAction} parents={parents} heads={heads} />
      </Panel>
    </div>
  );
}
