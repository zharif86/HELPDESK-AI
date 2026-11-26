"use client";

import { useActionState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { idleState, type ActionState } from "@/server/actions/state";

type Option = { id: string; name: string; code: string };

export function CategoryForm({
  action,
  parents,
  category,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  parents: Option[];
  category?: {
    code: string;
    name: string;
    description: string | null;
    parentId: string | null;
    isActive: boolean;
    sortOrder: number;
  };
}) {
  const [state, formAction] = useActionState(action, idleState);
  const field = (name: string) => state.fieldErrors?.[name]?.[0];
  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {!category ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="code">
            Code
          </label>
          <input id="code" name="code" required className={inputClass} placeholder="NETWORK" />
          {field("code") ? <p className="mt-1 text-xs text-red-700">{field("code")}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Code <span className="font-medium text-slate-900">{category.code}</span>
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required defaultValue={category?.name} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
          Description
        </label>
        <textarea id="description" name="description" rows={3} defaultValue={category?.description ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="parentId">
          Parent category
        </label>
        <select id="parentId" name="parentId" defaultValue={category?.parentId ?? ""} className={inputClass}>
          <option value="">None</option>
          {parents.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="sortOrder">
          Display order
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={category?.sortOrder ?? 0}
          className={inputClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} />
        Active
      </label>
      <SubmitButton label={category ? "Save category" : "Create category"} />
    </form>
  );
}
