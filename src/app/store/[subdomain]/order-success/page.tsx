import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedStore, getOrderById } from "@/actions/storefront";
import { formatDzd } from "@/lib/cart";
import { PurchaseTracker } from "./PurchaseTracker";
import { CheckCircle2, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ order?: string }>;
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { subdomain } = await params;
  const { order: orderId } = await searchParams;

  const store = await getPublishedStore(subdomain);
  if (!store || !orderId) notFound();

  const order = await getOrderById(store.org.id, orderId);
  if (!order) notFound();

  const isPaid = order.paymentStatus === "paid";

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {isPaid && <PurchaseTracker orderId={order.id} valueCents={order.totalCents} />}

      {isPaid ? (
        <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: store.settings.themeColor }} />
      ) : (
        <Clock size={48} className="mx-auto mb-4 text-amber-500" />
      )}

      <h1 className="text-lg font-bold text-slate-900 mb-2">
        {isPaid ? "تم الدفع بنجاح!" : "جاري تأكيد الدفع..."}
      </h1>
      <p className="text-slate-500 text-sm mb-1">
        {isPaid
          ? "شكرًا لك، طلبك قيد التجهيز الآن."
          : "قد يستغرق تأكيد الدفع لحظات. حدّث الصفحة إذا لم تتغير الحالة."}
      </p>
      <p className="text-slate-800 font-bold mt-4">{formatDzd(order.totalCents)}</p>

      <Link
        href="/"
        className="inline-block mt-6 text-sm font-medium underline"
        style={{ color: store.settings.themeColor }}
      >
        رجوع للمتجر
      </Link>
    </div>
  );
}
