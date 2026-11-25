"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth-actions";
import { idleState } from "@/server/actions/state";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, idleState);

  return (
    <form action={action} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" && state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.message}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-700 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-700 focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#123056] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
