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
      success?: unknown;
      tracking?: unknown;
    };
    try {
      data = JSON.parse(text);
    } catch {
      console.error("EcoTrack: استجابة غير JSON:", text.slice(0, 300));
      return { success: false, error: "استجابة غير متوقعة من شركة التوصيل" };
    }

    // النجاح أحيانًا يرجع مسطّحًا مباشرة بالمستوى الأعلى (بدون تغليف داخل
    // results إطلاقًا): {success: true, tracking: "...", reference: "..."}
    if (data.success === true && typeof data.tracking === "string") {
      return { success: true, trackingNumber: data.tracking };
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

// ==================== جلب الولايات والبلديات المفعّلة فعليًا من EcoTrack ====================
// كل حساب توصيل (Anderson مثلًا) عنده قائمته الخاصة من الولايات/البلديات المُفعّلة
// وهي ليست بالضرورة كل ولايات/بلديات الجزائر. الاعتماد على قائمة ثابتة بالمشروع
// (wilayas.ts) يسبب أخطاء "Commune mal écrite" أو "Stop desk non disponible" لأنها
// لا تطابق قائمة الشركة الفعلية. لذلك نجيبها من EcoTrack ونعتمدها كمصدر الحقيقة
// عند بناء نموذج الطلب (اختيار الولاية/البلدية) قبل الإرسال.

export interface EcotrackWilaya {
  wilayaId: number;
  name: string; // بالفرنسية كما ترجعها EcoTrack
}

export interface EcotrackCommune {
  name: string; // بالفرنسية
  wilayaId: number;
  postalCode: string;
  hasStopDesk: boolean;
}

async function ecotrackGet<T>(
  credentials: EcotrackCredentials,
  path: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const base = normalizeBaseUrl(credentials.baseUrl);
  if (!base || !credentials.apiToken) {
    return { success: false, error: "بيانات حساب التوصيل غير مكتملة" };
  }

  try {
    const res = await fetch(`${base}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${credentials.apiToken}`,
        Accept: "application/json",
      },
      // بيانات الولايات/البلديات تتغيّر نادرًا — كاش ساعة يكفي ويقلل عدد الطلبات
      next: { revalidate: 3600 },
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("EcoTrack GET: استجابة غير JSON:", path, text.slice(0, 300));
      return { success: false, error: "استجابة غير متوقعة من شركة التوصيل" };
    }

    if (!res.ok) {
      console.error("EcoTrack GET error:", path, data);
      return { success: false, error: "تعذّر جلب البيانات من شركة التوصيل" };
    }

    return { success: true, data: data as T };
  } catch (err) {
    console.error("EcoTrack GET request error:", path, err);
    return { success: false, error: "تعذّر الاتصال بشركة التوصيل" };
  }
}

/** يجيب قائمة الولايات المفعّلة فعليًا لحساب التوصيل هذا (وليست كل ولايات الجزائر) */
export async function getEcotrackWilayas(
  credentials: EcotrackCredentials
): Promise<{ success: true; wilayas: EcotrackWilaya[] } | { success: false; error: string }> {
  const result = await ecotrackGet<Array<{ wilaya_id: number; wilaya_name: string }>>(
    credentials,
    "/api/v1/get/wilayas"
  );
  if (!result.success) return result;

  return {
    success: true,
    wilayas: result.data.map((w) => ({ wilayaId: w.wilaya_id, name: w.wilaya_name })),
  };
}

/**
 * يجيب قائمة البلديات المفعّلة لولاية معيّنة. كل بلدية فيها hasStopDesk —
 * استخدمها لتعطيل خيار "استلام من مكتب" بالواجهة إذا كانت false، لتفادي
 * خطأ "Stop desk non disponible pour cette commune" قبل حتى إرسال الطلب.
 */
export async function getEcotrackCommunes(
  credentials: EcotrackCredentials,
  wilayaId: number
): Promise<{ success: true; communes: EcotrackCommune[] } | { success: false; error: string }> {
  const result = await ecotrackGet<
    Record<string, { nom: string; wilaya_id: number; code_postal: string; has_stop_desk: number }>
  >(credentials, `/api/v1/get/communes?wilaya_id=${wilayaId}`);
  if (!result.success) return result;

  return {
    success: true,
    communes: Object.values(result.data).map((c) => ({
      name: c.nom,
      wilayaId: c.wilaya_id,
      postalCode: c.code_postal,
      hasStopDesk: c.has_stop_desk === 1,
    })),
  };
}

function normalizeArabicLatinText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // إزالة علامات التشكيل/الأكسنت (é → e)
    .replace(/[^a-z0-9\u0600-\u06FF]/g, ""); // إزالة المسافات والرموز
}

/**
 * شبكة أمان إضافية وقت الشحن: طلبات قديمة (قبل ربط EcoTrack، أو من متجر بدون
 * ربط وقتها) قد تحمل اسم بلدية بصيغة مختلفة قليلًا عن قائمة Anderson الحقيقية.
 * نطابقها هنا بتجاهل فروقات الأكسنت/الحالة/المسافات، ونرجّع الاسم المطابق
 * بالضبط كما تريده EcoTrack. لو ما لقى تطابق، يرجّع null.
 */
export function matchEcotrackCommune(customerCommune: string, activeCommunes: EcotrackCommune[]): EcotrackCommune | null {
  const target = normalizeArabicLatinText(customerCommune);
  if (!target) return null;
  const exact = activeCommunes.find((c) => normalizeArabicLatinText(c.name) === target);
  if (exact) return exact;
  const partial = activeCommunes.find(
    (c) => normalizeArabicLatinText(c.name).includes(target) || target.includes(normalizeArabicLatinText(c.name))
  );
  return partial ?? null;
}
