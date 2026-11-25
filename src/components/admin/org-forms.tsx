"use client";

import { useActionState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { idleState, type ActionState } from "@/server/actions/state";

type Option = { id: string; name: string; code?: string };

export function DepartmentForm({
  action,
  department,
  parents,
  heads,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  parents: Option[];
  heads: Option[];
  department?: {
    code: string;
    name: string;
    description: string | null;
    parentId: string | null;
    headUserId: string | null;
    isActive: boolean;
  };
}) {
  const [state, formAction] = useActionState(action, idleState);
  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Text label="Code" name="code" defaultValue={department?.code} required />
        <Text label="Name" name="name" defaultValue={department?.name} required />
        <Text label="Description" name="description" defaultValue={department?.description ?? ""} />
        <Choice label="Parent department" name="parentId" defaultValue={department?.parentId ?? ""} options={parents} empty="No parent" />
        <Choice label="Department head" name="headUserId" defaultValue={department?.headUserId ?? ""} options={heads} empty="No head assigned" />
      </div>
      <ActiveField defaultChecked={department?.isActive ?? true} />
      <SubmitButton label={department ? "Save department" : "Create department"} />
    </form>
  );
}

export function LocationForm({
  action,
  location,
  departments,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  departments: Option[];
  location?: {
    code: string;
    name: string;
    building: string | null;
    floor: string | null;
    room: string | null;
    departmentId: string | null;
    isActive: boolean;
  };
}) {
  const [state, formAction] = useActionState(action, idleState);
  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Text label="Code" name="code" defaultValue={location?.code} required />
        <Text label="Name" name="name" defaultValue={location?.name} required />
        <Text label="Building" name="building" defaultValue={location?.building ?? ""} />
        <Text label="Floor" name="floor" defaultValue={location?.floor ?? ""} />
        <Text label="Room" name="room" defaultValue={location?.room ?? ""} />
        <Choice
          label="Department"
          name="departmentId"
          defaultValue={location?.departmentId ?? ""}
          options={departments}
          empty="Not assigned"
        />
      </div>
      <ActiveField defaultChecked={location?.isActive ?? true} />
      <SubmitButton label={location ? "Save location" : "Create location"} />
    </form>
  );
}

function Text({ label, name, defaultValue = "", required = false }: { label: string; name: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input name={name} defaultValue={defaultValue} required={required} className={inputClass} />
    </label>
  );
}

function Choice({
  label,
  name,
  defaultValue,
  options,
  empty,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Option[];
  empty: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        <option value="">{empty}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.code ? `${option.code} — ${option.name}` : option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActiveField({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name="isActive" defaultChecked={defaultChecked} />
      Active
    </label>
  );
}
