"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { updateOrderStatusAction } from "@/actions/orders";
import { blockPhoneAction, unblockPhoneAction } from "@/actions/security";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-labels";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { ShoppingBag, MapPin, ShieldAlert, ShieldBan, TriangleAlert, ChevronDown } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

interface OrderRisk {
  isBlocked: boolean;
  blockScope: "store" | "platform" | null;
  customerTotalOrders: number;
  customerCanceledOrders: number;
  highCancelRate: boolean;
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
  risk?: OrderRisk;
}

interface BlockedPhone {
  id: string;
  phone: string;
  reason: string | null;
  createdAt: Date;
}

interface OrdersClientProps {
  orgId: string;
  orders: Order[];
  blockedPhones: BlockedPhone[];
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

export function OrdersClient({ orgId, orders, blockedPhones, myRole }: OrdersClientProps) {
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState(orders);
  const [localBlocked, setLocalBlocked] = useState(blockedPhones);
  const [blockBusyPhone, setBlockBusyPhone] = useState<string | null>(null);

  const canManage = hasPermission(myRole as Role, "manage_orders");
  const blockedPhoneSet = new Set(localBlocked.map((b) => b.phone));

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

  async function handleBlockPhone(phone: string) {
    if (!phone) return;
    setBlockBusyPhone(phone);
    const result = await blockPhoneAction(orgId, phone, "حظر من صفحة الطلبات");
    setBlockBusyPhone(null);
    if (!result.success) {
      setError(result.error);
    } else {
      setLocalBlocked((prev) => [{ id: `tmp-${phone}`, phone, reason: "حظر من صفحة الطلبات", createdAt: new Date() }, ...prev]);
    }
  }

  async function handleUnblockPhone(blockId: string) {
    setBlockBusyPhone(blockId);
    const result = await unblockPhoneAction(orgId, blockId);
    setBlockBusyPhone(null);
    if (!result.success) {
      setError(result.error);
    } else {
      setLocalBlocked((prev) => prev.filter((b) => b.id !== blockId));
    }
  }

  async function handleAddBlock(phone: string, reason: string) {
    setBlockBusyPhone(phone);
    const result = await blockPhoneAction(orgId, phone, reason || undefined);
    setBlockBusyPhone(null);
    if (!result.success) {
      setError(result.error);
    } else {
      setLocalBlocked((prev) => [{ id: `tmp-${phone}`, phone, reason: reason || null, createdAt: new Date() }, ...prev]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الطلبات</h1>
        <p className="text-sm text-slate-500 mt-0.5">طلبات زبائن متجرك</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {canManage && (
        <BlockedPhonesPanel
          blocked={localBlocked}
          busyId={blockBusyPhone}
          onUnblock={handleUnblockPhone}
          onAdd={handleAddBlock}
          addBusy={!!blockBusyPhone}
        />
      )}

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

                  {/* تحذيرات حماية COD */}
                  {order.risk?.isBlocked && (
                    <div className="mt-1.5">
                      <Badge variant="danger">
                        <ShieldBan size={11} className="ml-1 inline" />
                        {order.risk.blockScope === "platform" ? "رقم محظور على مستوى المنصة" : "رقم محظور بمتجرك"}
                      </Badge>
                    </div>
                  )}
                  {!order.risk?.isBlocked && order.risk?.highCancelRate && (
                    <div className="mt-1.5">
                      <Badge variant="warning">
                        <TriangleAlert size={11} className="ml-1 inline" />
                        زبون يلغي كثيرًا ({order.risk.customerCanceledOrders}/{order.risk.customerTotalOrders})
                      </Badge>
                    </div>
                  )}
                  {canManage && order.customer?.phone && !blockedPhoneSet.has(order.customer.phone) && (
                    <button
                      onClick={() => handleBlockPhone(order.customer!.phone!)}
                      disabled={blockBusyPhone === order.customer.phone}
                      className="mt-1.5 flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <ShieldAlert size={12} />
                      حظر هذا الرقم من متجرك
                    </button>
                  )}
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

// ─── لوحة إدارة الأرقام المحظورة (خاصة بهذا المتجر) ────────────────────────────
function BlockedPhonesPanel({
  blocked,
  busyId,
  onUnblock,
  onAdd,
  addBusy,
}: {
  blocked: BlockedPhone[];
  busyId: string | null;
  onUnblock: (id: string) => void;
  onAdd: (phone: string, reason: string) => void;
  addBusy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newReason, setNewReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPhone.trim()) return;
    onAdd(newPhone.trim(), newReason.trim());
    setNewPhone("");
    setNewReason("");
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-2">
          <ShieldBan size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-slate-800">
            الأرقام المحظورة بمتجرك
          </span>
          {blocked.length > 0 && <Badge variant="danger">{blocked.length}</Badge>}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="رقم الهاتف (مثال: 0555xxxxxx)"
              dir="ltr"
              className="flex-1 min-w-[160px] text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="السبب (اختياري)"
              className="flex-1 min-w-[160px] text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button type="submit" size="sm" variant="danger" loading={addBusy}>
              حظر
            </Button>
          </form>

          {blocked.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد أرقام محظورة حاليًا</p>
          ) : (
            <div className="space-y-1.5">
              {blocked.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
                >
                  <div>
                    <span dir="ltr" className="font-medium text-slate-700">
                      {b.phone}
                    </span>
                    {b.reason && <span className="text-xs text-slate-400 mr-2"> — {b.reason}</span>}
                  </div>
                  <button
                    onClick={() => onUnblock(b.id)}
                    disabled={busyId === b.id}
                    className="text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                  >
                    إلغاء الحظر
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
