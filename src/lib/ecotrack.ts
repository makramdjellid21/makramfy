/**
 * تكامل مع EcoTrack (النظام الذي تعمل عليه Anderson Delivery وشركات أخرى كثيرة
 * بالجزائر). كل متجر يستخدم حسابه الخاص (رابط + Token)، حتى تصله أموال التحصيل
 * عند الاستلام مباشرة لحسابه هو.
 *
 * موثّق رسميًا عبر: https://documenter.getpostman.com/view/14517169/Tz5je15g
 * Endpoint: POST {baseUrl}/api/v1/create/order
 */

export interface EcotrackCredentials {
  baseUrl: string; // مثال: https://anderson.ecotrack.dz
  apiToken: string;
}

export interface EcotrackOrderInput {
  reference: string; // رقم طلبك أنت (اختياري، حتى 255 حرف)
  nomClient: string;
  telephone: string;
  telephone2?: string;
  adresse: string;
  communeName: string;
  wilayaCode: number;
  montant: number; // المبلغ المطلوب تحصيله عند الاستلام (بالدينار، وليس بالسنتيمات)
  remarque?: string;
  produit: string; // وصف المنتجات (حتى ~255 حرف)
  stopDesk: boolean; // true = استلام من مكتب، false = توصيل للمنزل
  weight?: number;
  fragile?: boolean;
  type?: "Livraison" | "Pick UP" | "Échange" | "Recouvrement";
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export async function createEcotrackOrder(
  credentials: EcotrackCredentials,
  order: EcotrackOrderInput
): Promise<{ success: true; trackingNumber: string } | { success: false; error: string }> {
  const base = normalizeBaseUrl(credentials.baseUrl);
  if (!base || !credentials.apiToken) {
    return { success: false, error: "بيانات حساب التوصيل غير مكتملة" };
  }

  const params = new URLSearchParams({
    api_token: credentials.apiToken,
    reference: order.reference,
    nom_client: order.nomClient,
    telephone: order.telephone,
    telephone_2: order.telephone2 ?? "",
    adresse: order.adresse,
    commune: order.communeName,
    code_wilaya: String(order.wilayaCode),
    montant: String(order.montant),
    remarque: order.remarque ?? "",
    produit: order.produit,
    type: order.type ?? "Livraison",
    stop_desk: order.stopDesk ? "1" : "0",
    weight: order.weight ? String(order.weight) : "",
    fragile: order.fragile ? "1" : "0",
  });

  try {
    const res = await fetch(`${base}/api/v1/create/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    const text = await res.text();
    let data: {
      results?: Record<string, unknown>;
      message?: string;
      errors?: Record<string, string[]>;
    };
    try {
      data = JSON.parse(text);
    } catch {
      console.error("EcoTrack: استجابة غير JSON:", text.slice(0, 300));
      return { success: false, error: "استجابة غير متوقعة من شركة التوصيل" };
    }

    // بعض أخطاء التحقق (مثل اسم بلدية غير صحيح) ترجع مباشرة بالمستوى الأعلى
    // {message, errors} بدون تغليف داخل results
    if (!data.results && (data.message || data.errors)) {
      const fieldMessages = data.errors ? Object.values(data.errors).flat() : [];
      const errorMessage =
        data.message ?? (fieldMessages.length > 0 ? fieldMessages.join(" — ") : "فشل إنشاء الشحنة");
      console.error("EcoTrack top-level error:", data);
      return { success: false, error: errorMessage };
    }

    // الرد عادة يُغلَّف داخل results.{reference} — سواء نجاح أو خطأ تحقق
    const entry = data.results?.[order.reference] as unknown;

    if (!entry || typeof entry !== "object") {
      console.error("EcoTrack: رد غير متوقع (بدون results لهذا الـ reference):", data);
      return { success: false, error: "تعذّر فهم رد شركة التوصيل" };
    }

    const successEntry = entry as { success?: unknown; tracking?: unknown };
    if (successEntry.success === true && typeof successEntry.tracking === "string") {
      return { success: true, trackingNumber: successEntry.tracking };
    }

    // خطأ تحقق: كائن {field: [رسائل]} — نجمعها برسالة واحدة مفهومة
    const messages = Object.values(entry as Record<string, string[]>).flat();
    const errorMessage = messages.length > 0 ? messages.join(" — ") : "فشل إنشاء الشحنة";
    console.error("EcoTrack validation error:", entry);
    return { success: false, error: errorMessage };
  } catch (err) {
    console.error("EcoTrack request error:", err);
    return { success: false, error: "تعذّر الاتصال بشركة التوصيل" };
  }
}
