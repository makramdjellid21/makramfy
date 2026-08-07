/**
 * تكامل مع EcoTrack (النظام الذي تعمل عليه Anderson Delivery وشركات أخرى كثيرة
 * بالجزائر). كل متجر يستخدم حسابه الخاص (رابط + Token)، حتى تصله أموال التحصيل
 * عند الاستلام مباشرة لحسابه هو.
 *
 * موثّق رسميًا عبر: https://documenter.getpostman.com/view/14517169/Tz5je15g
 * Endpoint: POST {baseUrl}/api/v1/create/order
 *
 * ملاحظات مهمة:
 * 1. حقل "type" يتوقعه EcoTrack كرقم صحيح (integer) وليس نص.
 *    القيمة 1 = توصيل عادي (Livraison) وهي الافتراضية والوحيدة المستخدمة حاليًا.
 * 2. EcoTrack يقصّ (truncate) قيمة "reference" داخل مفتاح results بالرد أحيانًا،
 *    فلا يمكن الاعتماد على تطابقها الحرفي الكامل مع القيمة المرسلة — لذلك نأخذ
 *    أول عنصر داخل results مباشرة بدل البحث بالمفتاح.
 */

export interface EcotrackCredentials {
  baseUrl: string; // مثال: https://anderson.ecotrack.dz
  apiToken: string;
}

export interface EcotrackOrderInput {
  reference: string; // رقم طلبك أنت (اختياري، حتى 255 حرف حسب التوثيق)
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
  /**
   * رمز نوع الشحنة كرقم صحيح يتوقعه EcoTrack. افتراضيًا 1 (توصيل عادي).
   * تأكد من القيم الصحيحة للأنواع الأخرى قبل استخدامها.
   */
  typeCode?: number;
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
    type: String(order.typeCode ?? 1), // 1 = Livraison (توصيل عادي) — يجب أن يكون رقمًا صحيحًا
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

    // بعض أخطاء التحقق (مثل اسم بلدية غير صحيح، أو حقل type) ترجع مباشرة
    // بالمستوى الأعلى {message, errors} بدون تغليف داخل results
    if (!data.results && (data.message || data.errors)) {
      const fieldMessages = data.errors ? Object.values(data.errors).flat() : [];
      const errorMessage =
        data.message ?? (fieldMessages.length > 0 ? fieldMessages.join(" — ") : "فشل إنشاء الشحنة");
      console.error("EcoTrack top-level error:", data);
      return { success: false, error: errorMessage };
    }

    if (!data.results || typeof data.results !== "object") {
      console.error("EcoTrack: رد غير متوقع (بدون results):", data);
      return { success: false, error: "تعذّر فهم رد شركة التوصيل" };
    }

    // EcoTrack يقصّ أحيانًا قيمة reference داخل مفتاح results، فلا نعتمد على
    // مطابقتها الحرفية — نأخذ أولًا المطابقة الدقيقة إن وُجدت، وإلا أول عنصر متاح
    const resultsObj = data.results;
    const entry: unknown =
      resultsObj[order.reference] ?? Object.values(resultsObj)[0];

    if (!entry || typeof entry !== "object") {
      console.error("EcoTrack: رد غير متوقع (results فاضي):", data);
      return { success: false, error: "تعذّر فهم رد شركة التوصيل" };
    }

    const successEntry = entry as { success?: unknown; tracking?: unknown };
    if (successEntry.success === true && typeof successEntry.tracking === "string") {
      return { success: true, trackingNumber: successEntry.tracking };
    }

    // خطأ تحقق: كائن {field: [رسائل]} — نجمعها برسالة واحدة مفهومة
    const messages = Object.values(entry as Record<string, string[]>)
      .flat()
      .filter((m): m is string => typeof m === "string");
    const errorMessage = messages.length > 0 ? messages.join(" — ") : "فشل إنشاء الشحنة";
    console.error("EcoTrack validation error:", entry);
    return { success: false, error: errorMessage };
  } catch (err) {
    console.error("EcoTrack request error:", err);
    return { success: false, error: "تعذّر الاتصال بشركة التوصيل" };
  }
}
