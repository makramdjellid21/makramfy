import { notFound } from "next/navigation";
import { getPublishedStore } from "@/actions/storefront";
import { StaticPageLayout } from "@/components/store/StaticPageLayout";

export default async function TermsPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  const { org, settings } = store;

  return (
    <StaticPageLayout title="شروط الاستخدام" themeColor={settings.themeColor}>
      {settings.termsText || (
        <>
          باستخدامك متجر {org.name} فإنك توافق على الشراء بحسن نية وتقديم بيانات توصيل
          صحيحة. الأسعار المعروضة نهائية وتشمل الضريبة إن وجدت، وقد تختلف رسوم التوصيل حسب
          ولايتك. يحتفظ المتجر بحق تعديل الأسعار والمنتجات المعروضة في أي وقت.
        </>
      )}
    </StaticPageLayout>
  );
}
