"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getOrdersByPhone } from "@/actions/storefront";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";
import { formatDzd } from "@/lib/cart";
import { ArrowRight, Search, PackageSearch } from "lucide-react";

interface OrderResult {
  id: string;
  status: string;
  totalCents: number;
  createdAt: Date;
  items: { id: string; productName: string; quantity: number }[];
}

interface TrackOrderFormProps {
  organizationId: string;
  themeColor: string;
}

export function TrackOrderForm({ organizationId, themeColor }: TrackOrderFormProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<OrderResult[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    const orders = await getOrdersByPhone(organizationId, phone.trim());
    setResults(orders);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowRight size={14} />
        رجوع للمتجر
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">تتبع طلبك</h1>
      <p className="text-sm text-slate-500 mb-6">أدخل رقم الهاتف اللي استخدمته وقت الطلب</p>

      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-8">
        <div className="flex-1">
          <Input placeholder="0555 xx xx xx" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <Button type="submit" loading={loading} style={{ backgroundColor: themeColor }}>
          <Search size={16} />
        </Button>
      </form>

      {searched && results.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <PackageSearch size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">ما لقينا أي طلب بهذا الرقم</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString("ar-DZ")}
                </span>
                <Badge variant="info">{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
              </div>
              <div className="text-sm text-slate-600 space-y-0.5 mb-2">
                {order.items.map((item) => (
                  <p key={item.id}>
                    {item.productName} × {item.quantity}
                  </p>
                ))}
              </div>
              <p className="font-bold" style={{ color: themeColor }}>
                {formatDzd(order.totalCents)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
