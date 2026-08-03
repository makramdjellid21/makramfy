"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatDzd } from "@/lib/cart";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

interface CartPanelProps {
  subdomain: string;
  themeColor: string;
  onNavigate?: () => void;
}

export function CartPanel({ subdomain, themeColor, onNavigate }: CartPanelProps) {
  const { items, ready, totalCents, updateQuantity, remove } = useCart(subdomain);

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <ShoppingBag size={40} className="text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">سلتك فارغة</h2>
        <p className="text-slate-500 text-sm mb-6">تصفح المنتجات وأضف اللي يعجبك</p>
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm"
          style={{ backgroundColor: themeColor }}
        >
          <ArrowLeft size={16} />
          رجوع للمتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="divide-y divide-slate-50 mb-4">
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center gap-3 py-4">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-slate-100 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
              {item.variantName && <p className="text-xs text-slate-400 mt-0.5">{item.variantName}</p>}
              <p className="text-sm text-slate-500 mt-0.5">{formatDzd(item.priceCents)}</p>
            </div>

            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shrink-0">
              <button
                className="h-8 w-8 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                className="h-8 w-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                disabled={item.quantity >= item.maxStock}
              >
                <Plus size={14} />
              </button>
            </div>

            <button onClick={() => remove(item.variantId)} className="text-slate-300 hover:text-red-500 shrink-0">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 text-sm">الإجمالي</span>
          <span className="text-lg font-bold text-slate-900">{formatDzd(totalCents)}</span>
        </div>
        <Link
          href="/checkout"
          onClick={onNavigate}
          className="w-full inline-flex items-center justify-center py-3 rounded-xl text-white font-bold text-sm"
          style={{ backgroundColor: themeColor }}
        >
          متابعة الدفع
        </Link>
      </div>
    </div>
  );
}
