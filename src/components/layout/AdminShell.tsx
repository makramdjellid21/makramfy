"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, LayoutDashboard, Store, Users, LogOut, Menu, X } from "lucide-react";
import { logoutAction } from "@/actions/auth";

const navItems = [
  { label: "نظرة عامة", href: "/", icon: LayoutDashboard },
  { label: "المتاجر", href: "/stores", icon: Store },
  { label: "المستخدمون", href: "/users", icon: Users },
];

function SidebarContent({ email, onNavigate }: { email: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">لوحة الأدمن</p>
          <p className="text-xs text-slate-500">MakramFy</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                active ? "bg-slate-900 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 pt-4 mt-4">
        <p className="text-xs text-slate-500 px-2 mb-2 truncate">{email}</p>
        <form action={logoutAction}>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-900 hover:text-white transition-colors">
            <LogOut size={16} />
            تسجيل خروج
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* الشريط الجانبي — ثابت على الشاشات الكبيرة */}
      <aside className="hidden lg:block w-60 shrink-0 border-l border-slate-800">
        <SidebarContent email={email} />
      </aside>

      {/* قائمة منزلقة على الهاتف */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-64 max-w-[85vw] bg-slate-950 border-l border-slate-800 shadow-xl">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-900"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <SidebarContent email={email} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* شريط علوي للهاتف فقط */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate-950 border-b border-slate-800 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-900 shrink-0"
            aria-label="القائمة"
          >
            <Menu size={20} className="text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <p className="font-bold text-sm">لوحة الأدمن</p>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
