import { notFound } from "next/navigation";
import { getPublishedStore, getStoreProducts } from "@/actions/storefront";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
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

  // نستخرج التصنيفات الفعلية اللي عندها منتجات (لعرضها بالقائمة الجانبية)
  const productList = await getStoreProducts(org.id);
  const categoriesMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const p of productList) {
    if (p.category) categoriesMap.set(p.category.slug, p.category);
  }
  const categoriesList = Array.from(categoriesMap.values());

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex flex-col" style={{ ["--store-color" as string]: settings.themeColor }}>
      <FacebookPixel pixelId={settings.facebookPixelId} />
      <StoreHeader
        subdomain={subdomain}
        storeName={org.name}
        description={settings.description}
        logoUrl={org.logoUrl}
        themeColor={settings.themeColor}
        announcementText={settings.announcementText}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        socialInstagram={settings.socialInstagram}
        socialFacebook={settings.socialFacebook}
        socialTelegramChannel={settings.socialTelegramChannel}
        socialWhatsapp={settings.socialWhatsapp}
        categories={categoriesList}
      />
      <main className="flex-1">{children}</main>
      <StoreFooter storeName={org.name} />
    </div>
  );
}
