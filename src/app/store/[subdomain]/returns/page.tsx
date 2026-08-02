import { notFound } from "next/navigation";
import { getPublishedStore } from "@/actions/storefront";
import { StaticPageLayout } from "@/components/store/StaticPageLayout";

export default async function ReturnsPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  const { settings } = store;

  return (
    <StaticPageLayout title="سياسة الإرجاع" themeColor={settings.themeColor}>
      {settings.returnPolicyText || (
        <>
          يمكنك طلب إرجاع أو استبدال المنتج خلال 7 أيام من تاريخ الاستلام، بشرط أن يكون
          المنتج بحالته الأصلية وبتغليفه الأصلي. للتواصل بخصوص الإرجاع، يرجى التواصل معنا
          مباشرة عبر بيانات التواصل الموجودة بالقائمة الجانبية.
        </>
      )}
    </StaticPageLayout>
  );
}
