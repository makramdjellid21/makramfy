import { notFound } from "next/navigation";
import { getPublishedStore } from "@/actions/storefront";
import { TrackOrderForm } from "./TrackOrderForm";

export default async function TrackPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  return <TrackOrderForm organizationId={store.org.id} themeColor={store.settings.themeColor} />;
}
