"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { createSubscriptionCheckoutAction } from "@/actions/billing";
import { PLAN_LIMITS } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";
import { Check, Zap } from "lucide-react";

interface BillingClientProps {
  orgId: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export function BillingClient({
  orgId,
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: BillingClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const paymentFailed = searchParams.get("failed") === "1";
  const paymentSuccess = searchParams.get("success") === "1";

  async function handleUpgrade(targetPlan: "pro" | "business") {
    setLoading(targetPlan);
    setError("");
    const result = await createSubscriptionCheckoutAction(orgId, targetPlan);
    if (!result.success) {
      setError(result.error);
      setLoading(null);
    } else {
      window.location.href = result.data.url;
    }
  }

  const planDetails = [
    {
      key: "free",
      label: "مجاني",
      price: PLAN_LIMITS.free.price,
      features: [
        `${PLAN_LIMITS.free.maxMembers} أعضاء`,
        `${formatBytes(PLAN_LIMITS.free.maxStorageBytes)} تخزين`,
        `${PLAN_LIMITS.free.maxProducts} منتجات`,
      ],
    },
    {
      key: "pro",
      label: "احترافي",
      price: PLAN_LIMITS.pro.price,
      features: [
        `${PLAN_LIMITS.pro.maxMembers} أعضاء`,
        `${formatBytes(PLAN_LIMITS.pro.maxStorageBytes)} تخزين`,
        "منتجات غير محدودة",
        "دعم بالأولوية",
      ],
    },
    {
      key: "business",
      label: "أعمال",
      price: PLAN_LIMITS.business.price,
      features: [
        "أعضاء غير محدودين",
        `${formatBytes(PLAN_LIMITS.business.maxStorageBytes)} تخزين`,
        "منتجات غير محدودة",
        "دعم 24/7",
      ],
    },
  ];

  const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
    active: { label: "نشط", variant: "success" },
    free: { label: "مجاني", variant: "default" },
    trialing: { label: "تجريبي", variant: "info" as "default" },
    past_due: { label: "متأخر", variant: "warning" },
    canceled: { label: "ملغي", variant: "danger" },
  };

  const currentBadge = statusBadge[status] ?? { label: status, variant: "default" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الفوترة والاشتراك</h1>
        <p className="text-sm text-slate-500 mt-1">إدارة خطة اشتراكك وتفاصيل الفوترة</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {paymentSuccess && (
        <Alert type="success">تم استلام دفعتك، جاري تفعيل خطتك (قد يستغرق دقيقة).</Alert>
      )}
      {paymentFailed && <Alert type="error">لم تكتمل عملية الدفع. حاول مرة أخرى.</Alert>}

      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">خطتك الحالية</h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {planDetails.find((p) => p.key === plan)?.label ?? plan}
              </span>
              <Badge variant={currentBadge.variant}>{currentBadge.label}</Badge>
            </div>
            {currentPeriodEnd && (
              <p className="text-sm text-slate-500 mt-2">
                {cancelAtPeriodEnd ? "ينتهي" : "يتجدد"} في{" "}
                {new Date(currentPeriodEnd).toLocaleDateString("ar-SA")}
              </p>
            )}
          </div>
        </div>

        {cancelAtPeriodEnd && (
          <Alert type="warning" className="mt-4">
            سيتم إلغاء اشتراكك في نهاية الفترة الحالية. يمكنك إعادة الاشتراك من بوابة الفوترة.
          </Alert>
        )}
      </div>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">الخطط المتاحة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {planDetails.map((p) => {
            const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2 };
            const isCurrent = p.key === plan;
            const isPro = p.key === "pro";
            const isHigherThanCurrent = PLAN_RANK[p.key] > PLAN_RANK[plan];
            const isLowerThanCurrent = PLAN_RANK[p.key] < PLAN_RANK[plan];

            return (
              <div
                key={p.key}
                className={`rounded-2xl border p-6 ${
                  isPro
                    ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                    : "border-slate-100 bg-white"
                }`}
              >
                {isPro && (
                  <p className="text-xs font-bold text-violet-600 uppercase mb-2">الأكثر شعبية</p>
                )}
                <h3 className="text-lg font-bold text-slate-900">{p.label}</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-4xl font-bold text-slate-900">
                    {p.price.toLocaleString("ar-DZ")}
                  </span>
                  <span className="text-slate-500 text-sm">د.ج</span>
                  {p.price > 0 && <span className="text-slate-500 text-sm">/شهر</span>}
                </div>

                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check size={14} className="text-violet-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center py-2 px-4 bg-slate-100 rounded-xl text-sm font-medium text-slate-600">
                    خطتك الحالية
                  </div>
                ) : isHigherThanCurrent ? (
                  <Button
                    className="w-full"
                    variant={isPro ? "primary" : "secondary"}
                    loading={loading === p.key}
                    onClick={() => handleUpgrade(p.key as "pro" | "business")}
                  >
                    <Zap size={14} />
                    الترقية الآن
                  </Button>
                ) : isLowerThanCurrent ? (
                  <div className="text-center py-2 px-4 rounded-xl text-sm text-slate-400 border border-dashed border-slate-200">
                    أقل من خطتك الحالية
                  </div>
                ) : (
                  <div className="text-center py-2 px-4 rounded-xl text-sm text-slate-400">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Alert type="info">
        <p>
          الدفع يتم عبر <strong>Chargily Pay</strong> (EDAHABIA / CIB). بعد الدفع بنجاح، تفعيل خطتك
          يتم تلقائيًا خلال دقيقة عبر Webhook.
        </p>
      </Alert>
    </div>
  );
}
