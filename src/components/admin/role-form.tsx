"use client";

import { useActionState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { idleState, type ActionState } from "@/server/actions/state";

type Permission = { key: string; description: string; module: string };

export function RoleForm({
  action,
  role,
  catalog,
  locked = [],
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  catalog: Permission[];
  locked?: readonly string[];
  role?: { key?: string; name: string; description: string; permissions: string[] };
}) {
  const [state, formAction] = useActionState(action, idleState);
  const modules = [...new Set(catalog.map((item) => item.module))];
  const selected = new Set(role?.permissions ?? []);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {role?.key ? (
          <label className="block text-sm font-medium text-slate-700">
            Key
            <input value={role.key} readOnly className={`${inputClass} bg-slate-50`} />
          </label>
        ) : (
          <label className="block text-sm font-medium text-slate-700">
            Key
            <input name="key" required placeholder="AUDITOR" className={inputClass} />
          </label>
        )}
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input name="name" required defaultValue={role?.name} className={inputClass} />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea name="description" required defaultValue={role?.description} rows={3} className={inputClass} />
      </label>
      <div className="space-y-4">
        {modules.map((module) => (
          <fieldset key={module}>
            <legend className="text-sm font-medium text-slate-900">{module}</legend>
            <div className="mt-2 space-y-2">
              {catalog
                .filter((item) => item.module === module)
                .map((item) => {
                  const isLocked = locked.includes(item.key);
                  const checked = selected.has(item.key) || isLocked;
                  return (
                    <label key={item.key} className="flex items-start gap-2 text-sm text-slate-700">
                      {isLocked ? <input type="hidden" name="permissions" value={item.key} /> : null}
                      <input
                        type="checkbox"
                        name="permissions"
                        value={item.key}
                        defaultChecked={checked}
                        disabled={isLocked}
                      />
                      <span>
                        <span className="font-medium">{item.key}</span>
                        <span className="mt-0.5 block text-slate-500">{item.description}</span>
                      </span>
                    </label>
                  );
                })}
            </div>
          </fieldset>
        ))}
      </div>
      <SubmitButton label={role ? "Save role" : "Create role"} />
    </form>
  );
}

export function DeleteRoleForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, idleState);
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Delete this role? This cannot be undone.")) event.preventDefault();
      }}
    >
      {state.status === "error" && state.message ? (
        <div className="mb-3">
          <Alert tone="error">{state.message}</Alert>
        </div>
      ) : null}
      <SubmitButton label="Delete role" pendingLabel="Deleting…" variant="danger" />
    </form>
  );
}
