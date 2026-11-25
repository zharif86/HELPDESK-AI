"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/server/actions/auth-actions";
import { idleState } from "@/server/actions/state";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, idleState);
  const field = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={action} className="space-y-4">
      {state.status === "error" && state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.message}
        </p>
      ) : null}
      <Field label="Current password" name="currentPassword" error={field("currentPassword")} />
      <Field label="New password" name="newPassword" error={field("newPassword")} />
      <Field label="Confirm new password" name="confirmPassword" error={field("confirmPassword")} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

function Field({ label, name, error }: { label: string; name: string; error?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type="password"
        required
        autoComplete="new-password"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-700 focus:ring-2"
      />
      {error ? <span className="mt-1 block text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}
