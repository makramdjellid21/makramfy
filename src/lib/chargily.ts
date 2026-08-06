import crypto from "crypto";

const CHARGILY_MODE = process.env.CHARGILY_MODE === "live" ? "live" : "test";

const BASE_URL =
  CHARGILY_MODE === "live"
    ? "https://pay.chargily.net/api/v2"
    : "https://pay.chargily.net/test/api/v2";

function getSecretKey(): string {
  const key = process.env.CHARGILY_SECRET_KEY;
  if (!key) throw new Error("CHARGILY_SECRET_KEY غير موجود بمتغيرات البيئة");
  return key;
}

export interface CreateCheckoutParams {
  amount: number; // بالدينار الجزائري (بدون كسور)
  successUrl: string;
  failureUrl?: string;
  description?: string;
  metadata?: Record<string, string>;
  locale?: "ar" | "en" | "fr";
}

export interface ChargilyCheckout {
  id: string;
  entity: "checkout";
  status: string;
  amount: number;
  currency: string;
  checkout_url: string;
  metadata: Record<string, string> | null;
}

export async function createChargilyCheckout(
  params: CreateCheckoutParams,
  secretKeyOverride?: string
): Promise<{ success: true; checkout: ChargilyCheckout } | { success: false; error: string }> {
  try {
    const res = await fetch(`${BASE_URL}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKeyOverride ?? getSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: "dzd",
        success_url: params.successUrl,
        failure_url: params.failureUrl,
        description: params.description,
        metadata: params.metadata,
        locale: params.locale ?? "ar",
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Chargily create checkout failed:", res.status, errBody);
      return { success: false, error: "تعذّر إنشاء عملية الدفع. حاول مرة أخرى." };
    }

    const checkout = (await res.json()) as ChargilyCheckout;
    return { success: true, checkout };
  } catch (err) {
    console.error("Chargily request error:", err);
    return { success: false, error: "تعذّر الاتصال ببوابة الدفع." };
  }
}

// ─── التحقق من توقيع الـ Webhook (HMAC-SHA256 hex بالمفتاح السري) ─────────────
export function verifyChargilySignature(
  rawBody: string,
  signatureHeader: string | null,
  secretKeyOverride?: string
): boolean {
  if (!signatureHeader) return false;
  const computed = crypto
    .createHmac("sha256", secretKeyOverride ?? getSecretKey())
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
  } catch {
    return false; // أطوال مختلفة = توقيع خاطئ
  }
}
