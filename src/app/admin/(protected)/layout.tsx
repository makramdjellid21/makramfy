import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { ShieldCheck, LayoutDashboard, Store, Users, LogOut } from "lucide-react";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (!user.isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <ShieldCheck size={40} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">وصول مرفوض</h1>
          <p className="text-slate-400 text-sm mb-6">
            حسابك ({user.email}) ما عنده صلاحية أدمن المنصة.
          </p>
          <form action={logoutAction}>
            <button className="text-sm text-slate-300 underline">تسجيل خروج</button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "نظرة عامة", href: "/", icon: LayoutDashboard },
    { label: "المتاجر", href: "/stores", icon: Store },
    { label: "المستخدمون", href: "/users", icon: Users },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-60 shrink-0 border-l border-slate-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">لوحة الأدمن</p>
            <p className="text-xs text-slate-500">MakramFy</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-4">
          <p className="text-xs text-slate-500 px-2 mb-2 truncate">{user.email}</p>
          <form action={logoutAction}>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-900 hover:text-white transition-colors">
              <LogOut size={16} />
              تسجيل خروج
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
