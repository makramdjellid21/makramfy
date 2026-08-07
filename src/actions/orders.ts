"use server";

import { db, withOrgContext } from "@/db";
import { orders, memberships, customers, blockedPhones, storeSettings, orderItems, organizations } from "@/db/schema";
import { eq, and, desc, count, inArray, or, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import type { ActionResult } from "./auth";
import { generateId } from "@/lib/utils";
import { createEcotrackOrder, getEcotrackCommunes, matchEcotrackCommune } from "@/lib/ecotrack";
import { revalidatePath } from "next/cache";

async function getMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
  return membership;
}

export async function getOrders(orgId: string) {
  return withOrgContext(orgId, async (tx) => {
    const orderList = await tx.query.orders.findMany({
      where: eq(orders.organizationId, orgId),
      with: { customer: true, items: true },
      orderBy: desc(orders.createdAt),
    });

    const phones = [...new Set(orderList.map((o) => o.customer?.phone).filter((p): p is string => Boolean(p)))];
    if (phones.length === 0) return orderList.map((o) => ({ ...o, canceledCount: 0, isBlocked: false }));

    // عدد الطلبات الملغاة/المرتجعة سابقًا لكل رقم هاتف بهذا المتجر (مؤشر احتيال)
    const canceledCounts = await tx
      .select({ phone: customers.phone, value: count() })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(
        and(
          eq(orders.organizationId, orgId),
          inArray(orders.status, ["canceled", "refunded"]),
          inArray(customers.phone, phones)
        )
      )
      .groupBy(customers.phone);

    const canceledMap = new Map(canceledCounts.map((c) => [c.phone, c.value]));

    // الأرقام المحظورة: إمّا خاصة بهذا المتجر أو محظورة على مستوى المنصة كلها
    const blocked = await tx
      .select({ phone: blockedPhones.phone })
      .from(blockedPhones)
      .where(and(inArray(blockedPhones.phone, phones), or(eq(blockedPhones.organizationId, orgId), isNull(blockedPhones.organizationId))));

    const blockedSet = new Set(blocked.map((b) => b.phone));

    return orderList.map((o) => ({
      ...o,
      canceledCount: o.customer?.phone ? canceledMap.get(o.customer.phone) ?? 0 : 0,
      isBlocked: o.customer?.phone ? blockedSet.has(o.customer.phone) : false,
    }));
  });
}

// ─── القائمة السوداء لأرقام الهواتف (حماية من الطلبات الوهمية) ─────────────────
export async function getBlockedPhonesAction(orgId: string): Promise<ActionResult<{ id: string; phone: string; reason: string | null; createdAt: Date }[]>> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };

  const rows = await withOrgContext(orgId, (tx) =>
    tx
      .select()
      .from(blockedPhones)
      .where(eq(blockedPhones.organizationId, orgId))
      .orderBy(desc(blockedPhones.createdAt))
  );

  return { success: true, data: rows };
}

export async function blockPhoneAction(orgId: string, phone: string, reason?: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  const cleanPhone = phone.trim();
  if (!cleanPhone) return { success: false, error: "رقم الهاتف مطلوب" };

  await withOrgContext(orgId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(blockedPhones)
      .where(and(eq(blockedPhones.organizationId, orgId), eq(blockedPhones.phone, cleanPhone)));
    if (existing) return;

    await tx.insert(blockedPhones).values({
      id: generateId(),
      organizationId: orgId,
      phone: cleanPhone,
      reason: reason?.trim() || null,
      reportedByOrgId: orgId,
    });
  });

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function unblockPhoneAction(orgId: string, id: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  await withOrgContext(orgId, (tx) =>
    tx.delete(blockedPhones).where(and(eq(blockedPhones.id, id), eq(blockedPhones.organizationId, orgId)))
  );

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function updateOrderStatusAction(
  orgId: string,
  orderId: string,
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled" | "refunded"
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  await withOrgContext(orgId, (tx) =>
    tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
  );

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── إرسال الطلب كشحنة فعلية لشركة التوصيل (Anderson / EcoTrack) ───────────────
export async function shipOrderToEcotrackAction(
  orgId: string,
  orderId: string
): Promise<ActionResult<{ trackingNumber: string }>> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  return withOrgContext(orgId, async (tx) => {
    const [settings] = await tx.select().from(storeSettings).where(eq(storeSettings.organizationId, orgId));
    if (!settings?.ecotrackApiToken || !settings.ecotrackBaseUrl) {
      return { success: false, error: "لم تربط حساب شركة التوصيل بعد من الإعدادات" };
    }

    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.organizationId, orgId)),
      with: { customer: true, items: true },
    });
    if (!order) return { success: false, error: "الطلب غير موجود" };
    if (order.ecotrackTrackingNumber) {
      return { success: false, error: "هذا الطلب مُرسل بالفعل لشركة التوصيل" };
    }
    if (!order.customer?.phone || !order.wilayaCode) {
      return { success: false, error: "بيانات الطلب ناقصة (الهاتف أو الولاية)" };
    }

    const productSummary = order.items
      .map((it) => `${it.productName} x${it.quantity}`)
      .join(", ")
      .slice(0, 250);

    const credentials = { baseUrl: settings.ecotrackBaseUrl, apiToken: settings.ecotrackApiToken };

    // نطابق اسم البلدية مع القائمة الحقيقية المفعّلة على حساب Anderson بدل
    // إرسال الاسم كما هو (قد يختلف بالإملاء/الأكسنت عن قائمتهم فيرفض الطلب)
    const communesResult = await getEcotrackCommunes(credentials, order.wilayaCode);
    const activeCommunes = communesResult.success ? communesResult.communes : [];
    const matchedCommune = activeCommunes.length > 0 ? matchEcotrackCommune(order.commune ?? "", activeCommunes) : null;

    if (activeCommunes.length > 0 && !matchedCommune) {
      return {
        success: false,
        error: `بلدية "${order.commune}" غير مفعّلة على حساب Anderson لهذه الولاية. تحقق من الاسم أو اختر بلدية مجاورة.`,
      };
    }

    // لو عندنا بيانات دقيقة عن دعم "استلام من مكتب" لهذه البلدية، نحترمها من
    // البداية بدل الاعتماد فقط على إعادة المحاولة بعد الخطأ
    let stopDesk = order.deliveryType === "desk" && (matchedCommune?.hasStopDesk ?? true);

    let result = await createEcotrackOrder(credentials, {
      reference: order.id.slice(0, 20),
      nomClient: order.customer.name,
      telephone: order.customer.phone,
      adresse: order.shippingAddress ?? "",
      communeName: matchedCommune?.name ?? order.commune ?? "",
      wilayaCode: order.wilayaCode,
      montant: order.totalCents / 100,
      produit: productSummary || "منتجات متنوعة",
      stopDesk,
    });

    // شبكة أمان إضافية: لو رجع خطأ "stop desk" رغم كل هذا، نعيد المحاولة
    // تلقائيًا كتوصيل منزلي بدل ما نفشل الطلب بالكامل
    if (!result.success && stopDesk && /stop.?desk/i.test(result.error)) {
      stopDesk = false;
      result = await createEcotrackOrder(credentials, {
        reference: order.id.slice(0, 20),
        nomClient: order.customer.name,
        telephone: order.customer.phone,
        adresse: order.shippingAddress ?? "",
        communeName: matchedCommune?.name ?? order.commune ?? "",
        wilayaCode: order.wilayaCode,
        montant: order.totalCents / 100,
        produit: productSummary || "منتجات متنوعة",
        stopDesk: false,
      });
    }

    if (!result.success) return { success: false, error: result.error };

    await tx
      .update(orders)
      .set({ ecotrackTrackingNumber: result.trackingNumber, ecotrackShippedAt: new Date(), status: "processing" })
      .where(eq(orders.id, orderId));

    revalidatePath("/dashboard");
    return { success: true, data: { trackingNumber: result.trackingNumber } };
  });
}
