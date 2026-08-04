"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  Package,
  ShoppingBag,
  ChevronDown,
  Plus,
  LogOut,
  X,
  Info,
  Palette,
  Megaphone,
  FileText,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { logoutAction } from "@/actions/auth";
import { NotificationBell } from "./NotificationBell";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface SidebarOrg {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  plan?: string;
}

interface SidebarUser {
  id: string;
  name?: string | null;
  email: string;
  imageUrl?: string | null;
}

interface DashboardSidebarProps {
  user: SidebarUser;
  organizations: SidebarOrg[];
  currentOrgSlug?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function DashboardSidebar({
  user,
  organizations,
  currentOrgSlug,
  onNavigate,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [orgOpen, setOrgOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settingsTabs = [
    { id: "general", label: "المعلومات العامة", icon: Info },
    { id: "appearance", label: "المظهر والتواصل", icon: Palette },
    { id: "promo", label: "الترويج والتواصل الاجتماعي", icon: Megaphone },
    { id: "legal", label: "الصفحات القانونية", icon: FileText },
    { id: "marketing", label: "التسويق والتكاملات", icon: TrendingUp },
  ];

  const currentOrg = organizations.find((o) => o.slug === currentOrgSlug) ?? organizations[0];

  const navItems: NavItem[] = currentOrg
    ? [
        {
          label: "لوحة التحكم",
          href: `/dashboard/${currentOrg.slug}`,
          icon: LayoutDashboard,
        },
        {
          label: "المنتجات",
          href: `/dashboard/${currentOrg.slug}/products`,
          icon: Package,
        },
        {
          label: "الطلبات",
          href: `/dashboard/${currentOrg.slug}/orders`,
          icon: ShoppingBag,
        },
        {
          label: "الأعضاء",
          href: `/dashboard/${currentOrg.slug}/members`,
          icon: Users,
        },
        {
          label: "الفوترة",
          href: `/dashboard/${currentOrg.slug}/billing`,
          icon: CreditCard,
        },
        {
          label: "الإعدادات",
          href: `/dashboard/${currentOrg.slug}/settings`,
          icon: Settings,
        },
      ]
    : [];

  const planBadge: Record<string, { label: string; variant: "default" | "info" | "purple" }> = {
    free: { label: "مجاني", variant: "default" },
    pro: { label: "احترافي", variant: "info" },
    business: { label: "أعمال", variant: "purple" },
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-100">
      {/* Logo */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="MakramFy" className="h-8 w-8 rounded-xl object-cover" />
          <span className="font-bold text-slate-900">
            Makram<span className="text-violet-600">Fy</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {currentOrg && <NotificationBell orgId={currentOrg.id} />}
          {onClose && (
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 shrink-0"
              aria-label="إغلاق"
            >
              <X size={18} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Org Switcher */}
      <div className="p-3 border-b border-slate-100">
        <button
          onClick={() => setOrgOpen(!orgOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Avatar name={currentOrg?.name} imageUrl={currentOrg?.logoUrl} size="sm" />
          <div className="flex-1 text-right min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {currentOrg?.name ?? "اختر متجر"}
            </p>
            {currentOrg?.plan && (
              <Badge variant={planBadge[currentOrg.plan]?.variant ?? "default"}>
                {planBadge[currentOrg.plan]?.label ?? currentOrg.plan}
              </Badge>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 transition-transform shrink-0",
              orgOpen && "rotate-180"
            )}
          />
        </button>

        {orgOpen && (
          <div className="mt-2 rounded-xl border border-slate-100 bg-white shadow-lg overflow-hidden">
            {organizations.map((org) => (
              <Link
                key={org.id}
                href={`/dashboard/${org.slug}`}
                onClick={() => {
                  setOrgOpen(false);
                  onNavigate?.();
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors",
                  org.slug === currentOrgSlug && "bg-violet-50"
                )}
              >
                <Avatar name={org.name} imageUrl={org.logoUrl} size="xs" />
                <span className="text-sm text-slate-700 truncate">{org.name}</span>
              </Link>
            ))}
            <Link
              href="/dashboard/new"
              onClick={() => {
                setOrgOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-3 px-3 py-2.5 text-violet-600 hover:bg-violet-50 transition-colors border-t border-slate-100"
            >
              <Plus size={16} />
              <span className="text-sm">متجر جديد</span>
            </Link>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const isSettings = item.label === "الإعدادات";

          if (isSettings) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={18} className={active ? "text-violet-600" : "text-slate-400"} />
                  <span className="flex-1 text-right">{item.label}</span>
                  <ChevronDown size={14} className={cn("transition-transform", settingsOpen && "rotate-180")} />
                </button>
                {settingsOpen && (
                  <div className="mt-1 mr-8 space-y-0.5 border-r border-slate-100 pr-3">
                    {settingsTabs.map((tab) => (
                      <Link
                        key={tab.id}
                        href={`${item.href}?tab=${tab.id}`}
                        onClick={onNavigate}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                      >
                        <tab.icon size={13} className="text-slate-400 shrink-0" />
                        {tab.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={18} className={active ? "text-violet-600" : "text-slate-400"} />
              {item.label}
            </Link>
          );
        })}

        {organizations.length === 0 && (
          <Link
            href="/dashboard/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors"
          >
            <Plus size={18} />
            إنشاء متجر
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2">
          <Avatar name={user.name} imageUrl={user.imageUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user.name ?? "المستخدم"}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="تسجيل الخروج"
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
