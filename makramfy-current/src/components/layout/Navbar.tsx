"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="MakramFy" className="h-9 w-9 rounded-xl object-cover" />
            <span className="font-bold text-slate-900 text-xl">
              Makram<span className="text-violet-600">Fy</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              الأسعار
            </Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/register">
              <Button size="sm">ابدأ مجاناً</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-600"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden py-4 space-y-3 border-t border-slate-100">
            <Link href="/pricing" className="block text-sm text-slate-600 py-2">الأسعار</Link>
            <Link href="/login" className="block text-sm text-slate-600 py-2">تسجيل الدخول</Link>
            <Link href="/register">
              <Button size="sm" className="w-full">ابدأ مجاناً</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
