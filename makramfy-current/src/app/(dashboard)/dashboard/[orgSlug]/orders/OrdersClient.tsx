"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { updateOrderStatusAction } from "@/actions/orders";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-labels";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { ShoppingBag, MapPin } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  deliveryPriceCents: number;
  wilayaName: string | null;
  commune: string | null;
  deliveryType: string | null;
  shippingAddress: string | null;
  createdAt: Date;
  customer: { name: string; phone: string | null } | null;
  items: OrderItem[];
}

interface OrdersClientProps {
  orgId: string;
  orders: Order[];
  myRole: string;
}

function formatDzd(cents: number) {
  return `${(cents / 100).toLocaleString("ar-DZ")} د.ج`;
}

const STATUS_VARIANT: Record<string, "default" | "info" | "purple" | "success" | "danger" | "warning"> = {
  pending: "warning",
  processing: "info",
  shipped: "purple",
  delivered: "success",
  canceled: "danger",
  refunded: "default",
};

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "canceled", "refunded"];

export function OrdersClient({ orgId, orders, myRole }: OrdersClientProps) {
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState(orders);

  const canManage = hasPermission(myRole as Role, "manage_orders");

  async function handleStatusChange(orderId: string, status: string) {
    setBusyId(orderId);
    const result = await updateOrderStatusAction(orgId, orderId, status as never);
    setBusyId(null);
    if (!result.success) {
      setError(result.error);
    } else {
      setLocalOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الطلبات</h1>
        <p className="text-sm text-slate-500 mt-0.5">طلبات زبائن متجرك</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {localOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <ShoppingBag size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">لا توجد طلبات بعد</h3>
          <p className="text-slate-500 text-sm">راح تظهر هنا أول ما يشتري زبون من متجرك</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {localOrders.map((order) => (
            <div key={order.id} className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {order.customer?.name ?? "زبون"}
                  </p>
                  {order.customer?.phone && (
                    <p className="text-xs text-slate-400" dir="ltr">
                      {order.customer.phone}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString("ar-DZ")}
                  </p>
                  {order.wilayaName && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={11} />
                      {order.wilayaName}
                      {order.commune && ` — ${order.commune}`}
                      {order.deliveryType && (
                        <span className="text-slate-400">
                          ({order.deliveryType === "home" ? "توصيل منزلي" : "استلام مكتب"})
                        </span>
                      )}
                    </p>
                  )}
                  {order.deliveryType === "home" && order.shippingAddress && (
                    <p className="text-xs text-slate-400 mt-0.5">{order.shippingAddress}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={STATUS_VARIANT[order.paymentStatus] ?? "default"}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                  </Badge>
                  {canManage ? (
                    <select
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span>{formatDzd(item.unitPriceCents * item.quantity)}</span>
                  </div>
                ))}
                {order.deliveryPriceCents > 0 && (
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>التوصيل</span>
                    <span>{formatDzd(order.deliveryPriceCents)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <span className="text-sm text-slate-500">الإجمالي</span>
                <span className="font-bold text-emerald-700">{formatDzd(order.totalCents)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
