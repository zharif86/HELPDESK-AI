import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/server/auth/current-user";
import { getPublicBranding } from "@/server/services/settings-service";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/account/password" : "/dashboard");
  const branding = await getPublicBranding();
  const next = (await searchParams).next;

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="hidden flex-col justify-between bg-[#0b1f3a] px-12 py-10 text-white lg:flex">
        <div>
          <p className="text-sm font-medium tracking-wide text-blue-200">AI IT Helpdesk</p>
          <h1 className="mt-8 max-w-md text-4xl font-semibold leading-tight">
            Intelligent technical support and IT service management.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
            Sign in to review organisation records, accounts, and the activity recorded for this system.
          </p>
        </div>
        <p className="text-sm text-slate-400">{branding.organisationName}</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-blue-700 lg:hidden">AI IT Helpdesk</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the account issued by your system administrator.
          </p>
          <div className="mt-8">
            <LoginForm next={next} />
          </div>
        </div>
      </section>
    </main>
  );
}
