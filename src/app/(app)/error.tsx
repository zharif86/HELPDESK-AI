"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">The page could not be loaded. Try again, or return to the dashboard.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-md bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white">
        Try again
      </button>
    </div>
  );
}
