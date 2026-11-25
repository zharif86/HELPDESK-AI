import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <p>
        Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className="rounded-md border border-slate-300 bg-white px-3 py-1.5" href={hrefFor(page - 1)}>
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link className="rounded-md border border-slate-300 bg-white px-3 py-1.5" href={hrefFor(page + 1)}>
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
