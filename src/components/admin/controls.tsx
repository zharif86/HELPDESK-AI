"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, dangerButtonClass } from "@/components/admin/styles";

export { buttonClass, dangerButtonClass, inputClass, secondaryButtonClass } from "@/components/admin/styles";

export function SubmitButton({
  label,
  pendingLabel = "Saving…",
  variant = "primary",
}: {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={variant === "danger" ? dangerButtonClass : buttonClass}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const className =
    tone === "error"
      ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800";
  return (
    <p className={className} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
