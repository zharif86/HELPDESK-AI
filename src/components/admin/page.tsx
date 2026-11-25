import Link from "next/link";
import { noticeMessage } from "@/lib/notices";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="rounded-md bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Flash({ notice, error }: { notice?: string; error?: string }) {
  const message = noticeMessage(notice);
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>;
  if (!message) return null;
  return <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>;
}

export function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5">{children}</section>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">{children}</p>;
}
