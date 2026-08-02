import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/lib/plans";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

function formatDzd(cents: number) {
  return `${(cents / 100).toLocaleString("ar-DZ")} د.ج`;
}

export default async function OrgDashboardPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(orgSlug);
  if (!data) notFound();

  const { org, membership, sub, usage, products, orders, members } = data;

  const plan = (sub?.plan ?? "free") as Plan;
  const limits = PLAN_LIMITS[plan];

  const memberCount = usage?.memberCount ?? members.length;
  const productCount = usage?.productCount ?? products.length;

  const memberPercent =
    limits.maxMembers === Infinity ? 0 : Math.min(100, Math.round((memberCount / limits.maxMembers) * 100));
  const productPercent =
    limits.maxProducts === Infinity ? 0 : Math.min(100, Math.round((productCount / limits.maxProducts) * 100));

  const planBadgeVariant: Record<string, "default" | "info" | "purple"> = {
    free: "default",
    pro: "info",
    business: "purple",
  };

  const planLabel: Record<string, string> = {
    free: "مجاني",
    pro: "احترافي",
    business: "أعمال",
  };

  const stats = [
    {
      label: "المنتجات",
      value: productCount,
      max: limits.maxProducts === Infinity ? "∞" : limits.maxProducts,
      percent: productPercent,
      icon: Package,
      color: "emerald",
      href: `/dashboard/${orgSlug}/products`,
    },
    {
      label: "الطلبات",
      value: orders.length,
      max: "∞",
      percent: 0,
      icon: ShoppingBag,
      color: "blue",
      href: `/dashboard/${orgSlug}/orders`,
    },
    {
      label: "الأعضاء",
      value: memberCount,
      max: limits.maxMembers === Infinity ? "∞" : limits.maxMembers,
      percent: memberPercent,
      icon: Users,
      color: "violet",
      href: `/dashboard/${orgSlug}/members`,
    },
  ];

  const colorMap = {
    violet: { bar: "bg-violet-500", bg: "bg-violet-50", icon: "text-violet-600" },
    blue: { bar: "bg-blue-500", bg: "bg-blue-50", icon: "text-blue-600" },
    emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50", icon: "text-emerald-600" },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
            <Badge variant={planBadgeVariant[plan]}>{planLabel[plan]}</Badge>
          </div>
          <p className="text-slate-500 text-sm">مرحباً، {user.name ?? "المستخدم"} 👋</p>
        </div>
        {membership.role === "OWNER" && plan === "free" && (
          <Link
            href={`/dashboard/${orgSlug}/billing`}
            className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors font-medium"
          >
            <TrendingUp size={16} />
            ترقية الخطة
          </Link>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const colors = colorMap[stat.color as keyof typeof colorMap];
          const content = (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <stat.icon size={20} className={colors.icon} />
                </div>
                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-3">{stat.label}</p>
              {stat.max !== "∞" ? (
                <>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                    <div className={`${colors.bar} h-2 rounded-full transition-all`} style={{ width: `${stat.percent}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {stat.percent}% من {stat.max}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">غير محدود</p>
              )}
            </div>
          );

          return (
            <Link key={stat.label} href={stat.href}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Recent Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">المنتجات الأخيرة</h2>
          <Link href={`/dashboard/${orgSlug}/products`} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            عرض الكل
            <ArrowLeft size={14} />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Package size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">لا توجد منتجات بعد</p>
            <Link href={`/dashboard/${orgSlug}/products`} className="text-sm text-emerald-600 font-medium mt-2 inline-block">
              أضف منتجك الأول
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 6).map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="w-full h-28 object-cover rounded-lg mb-3" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg mb-3 flex items-center justify-center">
                    <Package size={28} className="text-emerald-300" />
                  </div>
                )}
                <h3 className="font-semibold text-slate-900 text-sm">{product.name}</h3>
                <p className="text-sm text-emerald-700 font-bold mt-1">{formatDzd(product.basePriceCents)}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                  <Calendar size={12} />
                  {new Date(product.createdAt).toLocaleDateString("ar-DZ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">أحدث الطلبات</h2>
          <Link href={`/dashboard/${orgSlug}/orders`} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            عرض الكل
            <ArrowLeft size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <ShoppingBag size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{formatDzd(order.totalCents)}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString("ar-DZ")}</p>
                </div>
                <Badge variant="default">{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">الأعضاء</h2>
          <Link href={`/dashboard/${orgSlug}/members`} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            إدارة الأعضاء
            <ArrowLeft size={14} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {members.slice(0, 5).map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                {member.userId.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">عضو</p>
                <p className="text-xs text-slate-500 truncate">
                  انضم {new Date(member.createdAt).toLocaleDateString("ar-DZ")}
                </p>
              </div>
              <Badge variant={member.role === "OWNER" ? "purple" : member.role === "ADMIN" ? "info" : "default"}>
                {member.role === "OWNER" ? "مالك" : member.role === "ADMIN" ? "مشرف" : "عضو"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
