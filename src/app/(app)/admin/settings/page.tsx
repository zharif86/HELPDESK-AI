import { Flash, PageHeader, Panel } from "@/components/admin/page";
import { SettingsForm } from "@/components/admin/settings-form";
import { firstParam } from "@/lib/query";
import { requirePagePermission } from "@/server/auth/current-user";
import { getOrganisationSettings } from "@/server/services/settings-service";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor } = await requirePagePermission("settings.manage");
  const settings = await getOrganisationSettings(actor);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Settings"
        description="Organisation name and sign-in policy. Changes are written to the audit log. Passwords and provider secrets are not stored on this page."
      />
      <Flash notice={firstParam((await searchParams).notice)} />
      <Panel>
        <SettingsForm values={settings} />
      </Panel>
    </div>
  );
}
