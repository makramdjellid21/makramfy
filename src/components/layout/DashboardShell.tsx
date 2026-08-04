"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";

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

interface DashboardShellProps {
  user: SidebarUser;
  organizations: SidebarOrg[];
  currentOrgSlug?: string;
  children: React.ReactNode;
}

export function DashboardShell({ user, organizations, currentOrgSlug, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const currentOrg = organizations.find((o) => o.slug === currentOrgSlug) ?? organizations[0];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* الشريط الجانبي — ثابت على الشاشات الكبيرة */}
      <div className="hidden lg:block w-64 shrink-0 border-l border-slate-100 overflow-y-auto">
        <DashboardSidebar user={user} organizations={organizations} currentOrgSlug={currentOrgSlug} />
      </div>

      {/* قائمة جانبية منزلقة على الهاتف */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-72 max-w-[85vw] shadow-xl">
            <DashboardSidebar
              user={user}
              organizations={organizations}
              currentOrgSlug={currentOrgSlug}
              onNavigate={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* شريط علوي للهاتف فقط */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-100 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 shrink-0"
            aria-label="القائمة"
          >
            <Menu size={20} className="text-slate-700" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="MakramFy" className="h-7 w-7 rounded-lg object-cover shrink-0" />
            <span className="font-bold text-slate-900 text-sm truncate">
              Makram<span className="text-violet-600">Fy</span>
            </span>
          </Link>
          <div className="flex-1" />
          {currentOrg && <NotificationBell orgId={currentOrg.id} />}
        </div>

        <main className="min-h-full flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
