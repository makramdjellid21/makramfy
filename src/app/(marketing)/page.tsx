import Link from "next/link";
import { ArrowLeft, Check, Store, CreditCard, Palette, Package, Globe, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/dashboard" : "/register";
  const heroCtaLabel = user ? "الذهاب للوحة التحكم" : "أنشئ متجرك مجاناً";
  const bottomCtaLabel = user ? "الذهاب للوحة التحكم" : "أنشئ متجرك الآن";

  const features = [
    {
      icon: Store,
      title: "متجرك خلال دقائق",
      desc: "أنشئ متجرك الإلكتروني برابط خاص فيه (subdomain) بدون أي خبرة تقنية، وابدأ البيع فورًا.",
    },
    {
      icon: CreditCard,
      title: "دفع جزائري 100%",
      desc: "اقبل الدفع من زبائنك عبر EDAHABIA وCIB مباشرة من خلال Chargily Pay، أو فعّل الدفع عند الاستلام.",
    },
    {
      icon: Package,
      title: "إدارة منتجات ومخزون",
      desc: "أضف منتجاتك بتصنيفات وصور وأسعار بالدينار الجزائري، وتابع المخزون أول بأول.",
    },
    {
      icon: Truck,
      title: "إدارة الطلبات بسهولة",
      desc: "كل طلب يوصلك فورًا مع بيانات الزبون والعنوان، وتقدر تتابع حالته من الاستلام للتسليم.",
    },
    {
      icon: Palette,
      title: "تخصيص واجهة المتجر",
      desc: "اختر ألوان متجرك، ارفع شعارك وبانر، واكتب وصف يعكس هوية علامتك التجارية.",
    },
    {
      icon: Globe,
      title: "متجرك، دومينك",
      desc: "كل متجر يحصل على رابط مستقل خاص فيه، معزول تمامًا عن باقي المتاجر ببياناته وطلباته.",
    },
  ];

  const stats = [
    { value: "٠ دج", label: "رسوم إنشاء المتجر" },
    { value: "٢", label: "طرق دفع محلية" },
    { value: "٩٩.٩٪", label: "وقت التشغيل" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-950/50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm text-violet-200 border border-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              متوفر الآن للجزائر — ابدأ مجاناً بدون بطاقة ائتمانية
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              أنشئ متجرك الإلكتروني{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300">
                في دقائق
              </span>
            </h1>

            <p className="text-lg md:text-xl text-violet-200 mb-10 leading-relaxed">
              MakramFy منصة جزائرية تمنحك كل ما تحتاجه لبيع منتجاتك أونلاين — متجر خاص فيك،
              دفع محلي عبر Chargily Pay، وإدارة كاملة للمنتجات والطلبات.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ctaHref}>
                <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-8">
                  {heroCtaLabel}
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/20">
                  عرض الأسعار
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 80L1440 80L1440 40C1200 80 960 0 720 0C480 0 240 80 0 40L0 80Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-violet-700">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              كل ما يحتاجه متجرك في مكان واحد
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              بُنيت MakramFy خصيصًا للتجار الجزائريين اللي يبون يبيعوا أونلاين بدون تعقيد.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:border-violet-200 hover:bg-violet-50 transition-all duration-200 group"
              >
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:border-violet-200 transition-colors">
                  <f.icon size={22} className="text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            جاهز تبيع أونلاين؟
          </h2>
          <p className="text-lg text-violet-200 mb-8">
            انضم للتجار اللي فتحوا متاجرهم على MakramFy وبدأوا يبيعوا بلا تعقيد.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ctaHref}>
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-8">
                {bottomCtaLabel}
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-violet-200 flex-wrap">
            {["لا بطاقة ائتمانية", "إلغاء في أي وقت", "دفع محلي جزائري"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
