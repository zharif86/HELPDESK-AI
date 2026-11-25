import { PasswordForm } from "@/components/password-form";
import { requireUser } from "@/server/auth/current-user";

export default async function ChangePasswordPage() {
  const { user } = await requireUser("password-change");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-slate-900">Change password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {user.mustChangePassword
            ? "This account must set a new password before the dashboard can open."
            : "Choose a new password for this account."}
        </p>
        <div className="mt-6">
          <PasswordForm />
        </div>
      </div>
    </main>
  );
}
