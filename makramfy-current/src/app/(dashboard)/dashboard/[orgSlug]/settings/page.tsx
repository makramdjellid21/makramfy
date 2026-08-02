import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { getStoreSettings } from "@/actions/store-settings";
import { SettingsClient } from "./SettingsClient";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export default async function SettingsPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(orgSlug);
  if (!data) notFound();

  const { org, membership } = data;
  const settings = await getStoreSettings(org.id);

  return (
    <div className="max-w-2xl mx-auto">
      <SettingsClient
        orgId={org.id}
        org={org}
        settings={settings}
        myRole={membership.role}
        storeUrl={`${orgSlug}.${ROOT_DOMAIN}`}
      />
    </div>
  );
}
