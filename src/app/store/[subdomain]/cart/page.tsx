"use client";

import { use } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatDzd } from "@/lib/cart";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default function CartPage({ params }: PageProps) {
  const { subdomain } = use(params);
  const { items, ready, totalCents, updateQuantity, remove } = useCart(subdomain);

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={40} className="text-slate-300 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-slate-700 mb-2">سلتك فارغة</h1>
        <p className="text-slate-500 text-sm mb-6">تصفح المنتجات وأضف اللي يعجبك</p>
        <Link href="/">
          <Button>
            <ArrowLeft size={16} />
            رجوع للمتجر
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">سلة المشتريات</h1>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-6">
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center gap-4 p-4">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-slate-100 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
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

            <button
              onClick={() => remove(item.variantId)}
              className="text-slate-300 hover:text-red-500 shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">الإجمالي</span>
          <span className="text-xl font-bold text-slate-900">{formatDzd(totalCents)}</span>
        </div>
        <Link href="/checkout">
          <Button className="w-full" size="lg">
            متابعة الدفع
          </Button>
        </Link>
      </div>
    </div>
  );
}
