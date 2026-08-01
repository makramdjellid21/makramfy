"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatDzd } from "@/lib/cart";
import { WILAYAS, getWilaya, getDeliveryPrice } from "@/lib/wilayas";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createOrderAction, createOrderPaymentCheckoutAction } from "@/actions/storefront";
import { trackInitiateCheckout, trackPurchase } from "@/components/store/FacebookPixel";
import { CheckCircle2, Truck, CreditCard, Home, Building2 } from "lucide-react";

interface CheckoutFormProps {
  subdomain: string;
  organizationId: string;
  themeColor: string;
}

export function CheckoutForm({ subdomain, organizationId, themeColor }: CheckoutFormProps) {
  const router = useRouter();
  const { items, ready, totalCents: itemsTotalCents, clear } = useCart(subdomain);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilayaCode, setWilayaCode] = useState("");
  const [commune, setCommune] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);

  const selectedWilaya = wilayaCode ? getWilaya(Number(wilayaCode)) : undefined;
  const deliveryPriceDzd = wilayaCode ? getDeliveryPrice(Number(wilayaCode), deliveryType) ?? 0 : 0;
  const deliveryPriceCents = Math.round(deliveryPriceDzd * 100);
  const totalCents = itemsTotalCents + deliveryPriceCents;

  useEffect(() => {
    if (ready && items.length > 0) {
      trackInitiateCheckout({ value: itemsTotalCents / 100, numItems: items.length });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return null;

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: themeColor }} />
        <h1 className="text-lg font-bold text-slate-900 mb-2">تم استلام طلبك!</h1>
        <p className="text-slate-500 text-sm mb-2">راح يتواصل معك صاحب المتجر قريبًا لتأكيد التوصيل.</p>
        <p className="text-slate-800 font-bold mb-6">{formatDzd(orderTotal)}</p>
        <Button onClick={() => router.push("/")}>رجوع للمتجر</Button>
      </div>
    );
  }

  if (items.length === 0) {
    router.replace("/cart");
    return null;
  }

  async function handleSubmit() {
    if (!wilayaCode || !commune.trim()) {
      setError("يرجى اختيار الولاية والبلدية");
      return;
    }
    if (deliveryType === "home" && !address.trim()) {
      setError("يرجى كتابة عنوان التوصيل التفصيلي");
      return;
    }

    setLoading(true);
    setError("");

    const orderResult = await createOrderAction(
      organizationId,
      {
        name,
        phone,
        address,
        wilayaCode: Number(wilayaCode),
        commune: commune.trim(),
        deliveryType,
      },
      items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }))
    );

    if (!orderResult.success) {
      setError(orderResult.error);
      setLoading(false);
      return;
    }

    if (paymentMethod === "online") {
      const checkoutResult = await createOrderPaymentCheckoutAction(
        subdomain,
        organizationId,
        orderResult.data.orderId,
        totalCents
      );
      if (!checkoutResult.success) {
        setError(checkoutResult.error);
        setLoading(false);
        return;
      }
      clear();
      window.location.href = checkoutResult.data.url;
      return;
    }

    trackPurchase({ value: totalCents / 100, orderId: orderResult.data.orderId });
    setOrderTotal(totalCents);
    setLoading(false);
    clear();
    setSuccess(true);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900 mb-1">إتمام الطلب</h1>

      {error && <Alert type="error" className="mb-4 mt-4">{error}</Alert>}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 mb-6 mt-6">
        <Input label="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} placeholder="محمد أحمد" />
        <Input
          label="رقم الهاتف"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0555 xx xx xx"
          dir="ltr"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">الولاية</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2"
              value={wilayaCode}
              onChange={(e) => {
                setWilayaCode(e.target.value);
                setCommune("");
              }}
            >
              <option value="">اختر الولاية</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {w.name_ar}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">البلدية</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              disabled={!selectedWilaya}
            >
              <option value="">اختر البلدية</option>
              {selectedWilaya?.communes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {deliveryType === "home" && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">العنوان التفصيلي</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 resize-none"
              rows={2}
              placeholder="الحي، اسم الشارع، رقم المنزل..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        )}
      </div>

      {selectedWilaya && (
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">طريقة التوصيل</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType("home")}
              className={`p-4 rounded-xl border-2 text-right transition-colors ${
                deliveryType === "home" ? "border-current" : "border-slate-200"
              }`}
              style={deliveryType === "home" ? { borderColor: themeColor, backgroundColor: `${themeColor}0d` } : {}}
            >
              <Home size={18} className="mb-2" style={{ color: deliveryType === "home" ? themeColor : "#94a3b8" }} />
              <p className="text-sm font-medium text-slate-800">توصيل للمنزل</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDzd(selectedWilaya.homePrice * 100)}</p>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("desk")}
              className={`p-4 rounded-xl border-2 text-right transition-colors ${
                deliveryType === "desk" ? "border-current" : "border-slate-200"
              }`}
              style={deliveryType === "desk" ? { borderColor: themeColor, backgroundColor: `${themeColor}0d` } : {}}
            >
              <Building2 size={18} className="mb-2" style={{ color: deliveryType === "desk" ? themeColor : "#94a3b8" }} />
              <p className="text-sm font-medium text-slate-800">استلام من المكتب</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDzd(selectedWilaya.deskPrice * 100)}</p>
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="text-sm font-medium text-slate-700 block mb-2">طريقة الدفع</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("cod")}
            className={`p-4 rounded-xl border-2 text-right transition-colors ${
              paymentMethod === "cod" ? "border-current" : "border-slate-200"
            }`}
            style={paymentMethod === "cod" ? { borderColor: themeColor, backgroundColor: `${themeColor}0d` } : {}}
          >
            <Truck size={18} className="mb-2" style={{ color: paymentMethod === "cod" ? themeColor : "#94a3b8" }} />
            <p className="text-sm font-medium text-slate-800">الدفع عند الاستلام</p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("online")}
            className={`p-4 rounded-xl border-2 text-right transition-colors ${
              paymentMethod === "online" ? "border-current" : "border-slate-200"
            }`}
            style={paymentMethod === "online" ? { borderColor: themeColor, backgroundColor: `${themeColor}0d` } : {}}
          >
            <CreditCard
              size={18}
              className="mb-2"
              style={{ color: paymentMethod === "online" ? themeColor : "#94a3b8" }}
            />
            <p className="text-sm font-medium text-slate-800">دفع أونلاين</p>
            <p className="text-xs text-slate-400 mt-0.5">EDAHABIA / CIB</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center justify-between text-sm text-slate-600 py-1">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatDzd(item.priceCents * item.quantity)}</span>
          </div>
        ))}
        {wilayaCode && (
          <div className="flex items-center justify-between text-sm text-slate-600 py-1">
            <span>التوصيل ({deliveryType === "home" ? "منزل" : "مكتب"})</span>
            <span>{formatDzd(deliveryPriceCents)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-50">
          <span className="font-medium text-slate-800">الإجمالي</span>
          <span className="font-bold text-lg" style={{ color: themeColor }}>
            {formatDzd(totalCents)}
          </span>
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={handleSubmit} loading={loading}>
        {paymentMethod === "online" ? "المتابعة للدفع" : "تأكيد الطلب"}
      </Button>
    </div>
  );
}
