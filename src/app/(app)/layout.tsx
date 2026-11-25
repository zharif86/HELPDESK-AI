import { AppShell } from "@/components/app-shell";
import { navigationFor } from "@/lib/navigation";
import { requireUser } from "@/server/auth/current-user";
import { getPublicBranding } from "@/server/services/settings-service";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  const branding = await getPublicBranding();

  return (
    <AppShell organisationName={branding.organisationName} user={user} groups={navigationFor(user.permissions)}>
      {children}
    </AppShell>
  );
}
