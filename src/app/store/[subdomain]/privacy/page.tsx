import { notFound } from "next/navigation";
import { getPublishedStore } from "@/actions/storefront";
import { StaticPageLayout } from "@/components/store/StaticPageLayout";

export default async function PrivacyPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  const { org, settings } = store;

  return (
    <StaticPageLayout title="سياسة الخصوصية" themeColor={settings.themeColor}>
      {settings.privacyPolicyText || (
        <>
          يحترم متجر {org.name} خصوصيتك. نجمع فقط البيانات الضرورية لإتمام طلبك (الاسم،
          الهاتف، العنوان) ولا نشاركها مع أي جهة خارجية إلا لغرض توصيل طلبك. لأي استفسار
          بخصوص بياناتك، يرجى التواصل معنا مباشرة.
        </>
      )}
    </StaticPageLayout>
  );
}
