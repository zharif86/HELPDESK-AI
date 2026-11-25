"use client";

import { useActionState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { idleState, type ActionState } from "@/server/actions/state";

type Option = { id: string; name: string; code?: string };

export function UserForm({
  action,
  user,
  roles,
  departments,
  locations,
  requirePassword = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  roles: Option[];
  departments: Option[];
  locations: Option[];
  requirePassword?: boolean;
  user?: {
    name: string;
    email: string;
    staffId: string | null;
    phone: string | null;
    jobTitle: string | null;
    departmentId?: string;
    locationId?: string;
    roleIds: string[];
  };
}) {
  const [state, formAction] = useActionState(action, idleState);
  const field = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" defaultValue={user?.name} error={field("name")} required />
        <Field label="Email" name="email" type="email" defaultValue={user?.email} error={field("email")} required />
        <Field label="Staff ID" name="staffId" defaultValue={user?.staffId ?? ""} error={field("staffId")} />
        <Field label="Phone" name="phone" defaultValue={user?.phone ?? ""} error={field("phone")} />
        <Field label="Job title" name="jobTitle" defaultValue={user?.jobTitle ?? ""} error={field("jobTitle")} />
        <Select label="Department" name="departmentId" defaultValue={user?.departmentId ?? ""} options={departments} />
        <Select label="Location" name="locationId" defaultValue={user?.locationId ?? ""} options={locations} />
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Roles</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="roleIds" value={role.id} defaultChecked={user?.roleIds.includes(role.id)} />
              {role.name}
            </label>
          ))}
        </div>
        {field("roleIds") ? <p className="mt-1 text-xs text-red-700">{field("roleIds")}</p> : null}
      </fieldset>
      {requirePassword ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Temporary password" name="password" type="password" error={field("password")} required />
          <Field label="Confirm password" name="confirmPassword" type="password" error={field("confirmPassword")} required />
        </div>
      ) : null}
      <SubmitButton label={user ? "Save account" : "Create account"} />
    </form>
  );
}

export function PasswordResetForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, idleState);
  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <p className="text-sm text-slate-600">
        The temporary password is not shown again. Existing sessions for this account are revoked, and the person must
        choose a new password at the next sign-in.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Temporary password" name="password" type="password" error={state.fieldErrors?.password?.[0]} required />
        <Field label="Confirm password" name="confirmPassword" type="password" error={state.fieldErrors?.confirmPassword?.[0]} required />
      </div>
      <SubmitButton label="Reset password" pendingLabel="Resetting…" />
    </form>
  );
}

export function StatusForm({
  action,
  label,
  message,
  tone = "secondary",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  message: string;
  tone?: "secondary" | "danger";
}) {
  const [state, formAction] = useActionState(action, idleState);
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {state.status === "error" && state.message ? (
        <div className="mb-3">
          <Alert tone="error">{state.message}</Alert>
        </div>
      ) : null}
      <SubmitButton label={label} pendingLabel="Working…" variant={tone === "danger" ? "danger" : "primary"} />
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} required={required} className={inputClass} />
      {error ? <span className="mt-1 block text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Option[];
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        <option value="">Not assigned</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.code ? `${option.code} — ${option.name}` : option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
