import { notFound } from "next/navigation";
import { getPublishedStore } from "@/actions/storefront";
import { StoreHeader } from "@/components/store/StoreHeader";
import { FacebookPixel } from "@/components/store/FacebookPixel";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const store = await getPublishedStore(subdomain);

  if (!store) notFound();

  const { org, settings } = store;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50" style={{ ["--store-color" as string]: settings.themeColor }}>
      <FacebookPixel pixelId={settings.facebookPixelId} />
      <StoreHeader
        subdomain={subdomain}
        storeName={org.name}
        logoUrl={org.logoUrl}
        themeColor={settings.themeColor}
      />
      <main>{children}</main>
      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-slate-400">
        متجر مبني عبر{" "}
        <a
          href="https://makramfy.com"
          className="font-semibold"
          style={{ color: settings.themeColor }}
        >
          MakramFy
        </a>
      </footer>
    </div>
  );
}
