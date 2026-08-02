import { notFound } from "next/navigation";
import { getPublishedStore } from "@/actions/storefront";
import { StaticPageLayout } from "@/components/store/StaticPageLayout";

export default async function AboutPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  const { org, settings } = store;

  return (
    <StaticPageLayout title="من نحن" themeColor={settings.themeColor}>
      {settings.aboutText || (
        <>
          مرحبًا بك في {org.name}. نحن متجر إلكتروني جزائري نسعى لتقديم منتجات أصيلة بأسعار
          تنافسية وتوصيل سريع لكل ولايات الجزائر.
          {settings.description ? `\n\n${settings.description}` : ""}
        </>
      )}
    </StaticPageLayout>
  );
}
