import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Your account does not have permission to open that page.
      </p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-blue-700">
        Back to dashboard
      </Link>
    </div>
  );
}
