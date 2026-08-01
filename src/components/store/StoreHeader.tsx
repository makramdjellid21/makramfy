"use client";

import Link from "next/link";
import { ShoppingCart, Store } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface StoreHeaderProps {
  subdomain: string;
  storeName: string;
  logoUrl: string | null;
  themeColor: string;
}

export function StoreHeader({ subdomain, storeName, logoUrl, themeColor }: StoreHeaderProps) {
  const { count, ready } = useCart(subdomain);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={`/`} className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-9 w-9 rounded-lg object-cover shrink-0" />
          ) : (
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <Store size={18} style={{ color: themeColor }} />
            </div>
          )}
          <span className="font-bold text-slate-900 truncate">{storeName}</span>
        </Link>

        <Link
          href={`/cart`}
          className="relative flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ShoppingCart size={20} className="text-slate-700" />
          {ready && count > 0 && (
            <span
              className="absolute -top-1 -left-1 h-5 w-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: themeColor }}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
