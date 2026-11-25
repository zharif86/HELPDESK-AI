import { logoutAction } from "@/server/actions/auth-actions";
import type { NavGroup } from "@/lib/navigation";
import { SideNav } from "@/components/side-nav";

type ShellUser = {
  name: string;
  email: string;
  roles: { name: string }[];
};

export function AppShell({
  organisationName,
  user,
  groups,
  children,
}: {
  organisationName: string;
  user: ShellUser;
  groups: NavGroup[];
  children: React.ReactNode;
}) {
  const role = user.roles.map((item) => item.name).join(", ") || "Signed in";

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#0b1f3a] text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs font-medium tracking-wide text-blue-200">AI IT Helpdesk</p>
          <p className="mt-1 truncate text-sm text-white">{organisationName}</p>
        </div>
        <SideNav groups={groups} />
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{role}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
          <details className="mt-3 md:hidden">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Menu</summary>
            <div className="mt-2 rounded-md bg-[#0b1f3a] text-white">
              <SideNav groups={groups} />
            </div>
          </details>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
