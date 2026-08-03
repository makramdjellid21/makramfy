import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLAN_LIMITS } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/dashboard" : "/register";

  const plans = [
    {
      key: "free",
      ...PLAN_LIMITS.free,
      popular: false,
      description: "مثالي للأفراد والفرق الصغيرة التي بدأت للتو.",
      features: [
        `${PLAN_LIMITS.free.maxMembers} أعضاء كحد أقصى`,
        `${formatBytes(PLAN_LIMITS.free.maxStorageBytes)} مساحة تخزين`,
        `${PLAN_LIMITS.free.maxProducts} منتجات`,
        "لوحة تحكم أساسية",
        "دعم عبر البريد الإلكتروني",
      ],
    },
    {
      key: "pro",
      ...PLAN_LIMITS.pro,
      popular: true,
      description: "للفرق النامية التي تحتاج مزيداً من المرونة والأدوات.",
      features: [
        `${PLAN_LIMITS.pro.maxMembers} أعضاء كحد أقصى`,
        `${formatBytes(PLAN_LIMITS.pro.maxStorageBytes)} مساحة تخزين`,
        "منتجات غير محدودة",
        "تحليلات متقدمة",
        "دعم بالأولوية",
        "تخصيص العلامة التجارية",
      ],
    },
    {
      key: "business",
      ...PLAN_LIMITS.business,
      popular: false,
      description: "للشركات الكبيرة التي تتطلب موارد غير محدودة وأماناً أعلى.",
      features: [
        "أعضاء غير محدودين",
        `${formatBytes(PLAN_LIMITS.business.maxStorageBytes)} مساحة تخزين`,
        "منتجات غير محدودة",
        "تحليلات متكاملة",
        "دعم مخصص 24/7",
        "SLA مضمون",
        "حسابات متعددة",
        "API مخصص",
      ],
    },
  ];

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 mb-4 text-sm font-medium">
            <Zap size={14} />
            أسعار شفافة وبسيطة
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            اختر خطتك المناسبة
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            ابدأ مجاناً وقم بالترقية عندما تحتاج لمزيد من الموارد.
            لا رسوم خفية، ويمكنك الإلغاء في أي وقت.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-500/30 scale-105"
                  : "bg-white border border-slate-200 text-slate-900"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    الأكثر شعبية ⭐
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${plan.popular ? "text-white" : "text-slate-900"}`}>
                  {plan.label}
                </h3>
                <p className={`text-sm leading-relaxed ${plan.popular ? "text-violet-200" : "text-slate-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-bold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                    {plan.price.toLocaleString("ar-DZ")}
                  </span>
                  <span className={`text-lg font-medium ${plan.popular ? "text-violet-200" : "text-slate-500"}`}>
                    {" "}
                    د.ج
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-sm ${plan.popular ? "text-violet-200" : "text-slate-500"}`}>
                      /شهر
                    </span>
                  )}
                </div>
                {plan.price === 0 && (
                  <span className={`text-sm ${plan.popular ? "text-violet-200" : "text-slate-500"}`}>
                    مجاناً للأبد
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                        plan.popular ? "bg-white/20" : "bg-violet-100"
                      }`}
                    >
                      <Check
                        size={12}
                        className={plan.popular ? "text-white" : "text-violet-600"}
                      />
                    </div>
                    <span className={plan.popular ? "text-violet-100" : "text-slate-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={ctaHref}>
                <Button
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? "bg-white text-violet-700 hover:bg-violet-50 font-bold"
                      : plan.key === "business"
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : ""
                  }`}
                  variant={plan.popular ? "secondary" : "primary"}
                >
                  {user ? "الذهاب للوحة التحكم" : plan.price === 0 ? "ابدأ مجاناً" : "ابدأ الآن"}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            أسئلة شائعة
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "هل يمكنني تغيير خطتي لاحقاً؟",
                a: "نعم، يمكنك الترقية أو تخفيض خطتك في أي وقت. التغييرات تنعكس فوراً.",
              },
              {
                q: "ماذا يحدث عند إلغاء الاشتراك؟",
                a: "بياناتك تبقى محفوظة، لكن ستعود لحدود الخطة المجانية. لا يتم حذف أي بيانات.",
              },
              {
                q: "هل يوجد عقد أو التزام؟",
                a: "لا، جميع الخطط تعمل شهرياً ويمكن الإلغاء في أي وقت دون رسوم.",
              },
              {
                q: "كيف يتم تأمين بياناتي؟",
                a: "نستخدم تشفير SSL، وتخزين آمن على Cloudinary، وقاعدة بيانات Neon المشفرة.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
