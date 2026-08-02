import { getPlatformStats } from "@/actions/admin";
import { Store, Users, ShoppingBag, Package, TrendingUp } from "lucide-react";

const PLAN_LABELS: Record<string, string> = { free: "مجاني", pro: "احترافي", business: "أعمال" };

function formatDzd(cents: number) {
  return `${(cents / 100).toLocaleString("ar-DZ")} د.ج`;
}

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();
  if (!stats) return null;

  const cards = [
    { label: "المتاجر", value: stats.storeCount, icon: Store },
    { label: "المستخدمون", value: stats.userCount, icon: Users },
    { label: "الطلبات (كل المتاجر)", value: stats.orderCount, icon: ShoppingBag },
    { label: "المنتجات (كل المتاجر)", value: stats.productCount, icon: Package },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">نظرة عامة</h1>
        <p className="text-sm text-slate-400 mt-1">إحصائيات منصة MakramFy بالكامل</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
              <card.icon size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-emerald-500" />
          <h2 className="font-semibold text-white">الإيراد الشهري التقديري</h2>
        </div>
        <p className="text-3xl font-bold text-emerald-400 mb-4">
          {formatDzd(stats.monthlyRevenueCents)}
          <span className="text-sm text-slate-500 font-normal"> /شهر</span>
        </p>

        <div className="space-y-2">
          {stats.planBreakdown.map((row) => (
            <div key={row.plan} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{PLAN_LABELS[row.plan] ?? row.plan}</span>
              <span className="text-slate-400">{row.value} متجر</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-4">
          * تقديري بناءً على عدد المتاجر بكل خطة، وليس دقيقًا بنسبة 100% (لا يأخذ بعين الاعتبار الترقيات
          الجزئية بمنتصف الشهر).
        </p>
      </div>
    </div>
  );
}
