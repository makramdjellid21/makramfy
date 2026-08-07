"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { updateOrderStatusAction, blockPhoneAction, unblockPhoneAction, getBlockedPhonesAction, shipOrderToEcotrackAction } from "@/actions/orders";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-labels";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { ShoppingBag, MapPin, ShieldAlert, ShieldOff, Ban, ChevronDown, Truck } from "lucide-react";

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
  canceledCount: number;
  isBlocked: boolean;
  ecotrackTrackingNumber: string | null;
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
  const [blockBusyPhone, setBlockBusyPhone] = useState<string | null>(null);
  const [shipBusyId, setShipBusyId] = useState<string | null>(null);

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

  async function handleBlockPhone(phone: string) {
    if (!confirm(`حظر الرقم ${phone}؟ لن يقدر يكمّل أي طلب جديد من متجرك.`)) return;
    setBlockBusyPhone(phone);
    const result = await blockPhoneAction(orgId, phone, "حظره التاجر يدويًا من صفحة الطلبات");
    setBlockBusyPhone(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLocalOrders((prev) => prev.map((o) => (o.customer?.phone === phone ? { ...o, isBlocked: true } : o)));
  }

  async function handleShip(orderId: string) {
    setShipBusyId(orderId);
    const result = await shipOrderToEcotrackAction(orgId, orderId);
    setShipBusyId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLocalOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, ecotrackTrackingNumber: result.data.trackingNumber, status: "processing" } : o
      )
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الطلبات</h1>
        <p className="text-sm text-slate-500 mt-0.5">طلبات زبائن متجرك</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {canManage && <BlockedPhonesPanel orgId={orgId} />}

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">
                      {order.customer?.name ?? "زبون"}
                    </p>
                    {order.isBlocked && (
                      <Badge variant="danger">
                        <ShieldOff size={11} className="ml-1" />
                        محظور
                      </Badge>
                    )}
                    {!order.isBlocked && order.canceledCount >= 2 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <ShieldAlert size={11} />
                        {order.canceledCount} طلبات ملغاة سابقًا
                      </span>
                    )}
                  </div>
                  {order.customer?.phone && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400" dir="ltr">
                        {order.customer.phone}
                      </p>
                      {canManage && !order.isBlocked && (
                        <button
                          onClick={() => handleBlockPhone(order.customer!.phone!)}
                          disabled={blockBusyPhone === order.customer.phone}
                          className="text-[11px] text-red-500 hover:text-red-600 underline"
                        >
                          حظر هذا الرقم
                        </button>
                      )}
                    </div>
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
                  {canManage &&
                    (order.ecotrackTrackingNumber ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-1" dir="ltr">
                        <Truck size={11} />
                        {order.ecotrackTrackingNumber}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleShip(order.id)}
                        disabled={shipBusyId === order.id}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 border border-blue-200 rounded-full px-2.5 py-1 hover:bg-blue-50 disabled:opacity-50"
                      >
                        <Truck size={11} />
                        {shipBusyId === order.id ? "جارٍ الإرسال..." : "إرسال لشركة التوصيل"}
                      </button>
                    ))}
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

function BlockedPhonesPanel({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [phones, setPhones] = useState<{ id: string; phone: string; reason: string | null; createdAt: Date }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const result = await getBlockedPhonesAction(orgId);
    if (result.success) setPhones(result.data);
    setLoaded(true);
  }

  useEffect(() => {
    if (open && !loaded) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleAdd() {
    if (!newPhone.trim()) return;
    setAdding(true);
    const result = await blockPhoneAction(orgId, newPhone.trim());
    setAdding(false);
    if (result.success) {
      setNewPhone("");
      load();
    }
  }

  async function handleUnblock(id: string) {
    setBusyId(id);
    const result = await unblockPhoneAction(orgId, id);
    setBusyId(null);
    if (result.success) setPhones((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <Ban size={15} className="text-red-500" />
          الأرقام المحظورة (حماية من الطلبات الوهمية)
        </span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="0555xxxxxx"
              dir="ltr"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              حظر
            </button>
          </div>

          {!loaded ? (
            <p className="text-xs text-slate-400">جارٍ التحميل...</p>
          ) : phones.length === 0 ? (
            <p className="text-xs text-slate-400">ما فيه أرقام محظورة عندك حاليًا</p>
          ) : (
            <div className="space-y-1.5">
              {phones.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-700" dir="ltr">{p.phone}</p>
                    {p.reason && <p className="text-xs text-slate-400">{p.reason}</p>}
                  </div>
                  <button
                    onClick={() => handleUnblock(p.id)}
                    disabled={busyId === p.id}
                    className="text-xs text-slate-400 hover:text-red-500"
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
