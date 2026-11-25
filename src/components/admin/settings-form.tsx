"use client";

import { useActionState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { updateSettingsAction } from "@/server/actions/settings-actions";
import { idleState } from "@/server/actions/state";

export function SettingsForm({
  values,
}: {
  values: {
    organisationName: string;
    supportEmail: string;
    sessionHours: number;
    maxFailedLogins: number;
    lockoutMinutes: number;
  };
}) {
  const [state, formAction] = useActionState(updateSettingsAction, idleState);
  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Organisation name
          <input name="organisationName" required defaultValue={values.organisationName} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Support email
          <input name="supportEmail" type="email" defaultValue={values.supportEmail} className={inputClass} />
        </label>
        <NumberField label="Session length (hours)" name="sessionHours" defaultValue={values.sessionHours} min={1} max={12} />
        <NumberField label="Failed sign-ins before lock" name="maxFailedLogins" defaultValue={values.maxFailedLogins} min={3} max={10} />
        <NumberField label="Lockout length (minutes)" name="lockoutMinutes" defaultValue={values.lockoutMinutes} min={5} max={120} />
      </div>
      <SubmitButton label="Save settings" />
    </form>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue: number;
  min: number;
  max: number;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input name={name} type="number" required min={min} max={max} defaultValue={defaultValue} className={inputClass} />
    </label>
  );
}
