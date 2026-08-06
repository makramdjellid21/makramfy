import { notFound } from "next/navigation";
import { getPublishedStore } from "@/actions/storefront";
import { CheckoutForm } from "./CheckoutForm";

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { subdomain } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  return (
    <CheckoutForm
      subdomain={subdomain}
      organizationId={store.org.id}
      themeColor={store.settings.themeColor}
      allowOnlinePayment={store.plan !== "free" && Boolean(store.settings.chargilySecretKey)}
    />
  );
}
