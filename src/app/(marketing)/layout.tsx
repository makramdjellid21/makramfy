import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/auth";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="MakramFy" className="h-7 w-7 rounded-lg object-cover" />
              <span className="font-bold text-white">
                Makram<span className="text-violet-400">Fy</span>
              </span>
            </div>
            <p className="text-sm">© 2026 MakramFy. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
