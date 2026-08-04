"use server";

import { db } from "@/db";
import { organizations, subscriptions, users, products, orders, storeSettings, blockedPhones } from "@/db/schema";
import { eq, and, count, countDistinct, desc, isNull, sql } from "drizzle-orm";
import { getPlatformAdmin } from "@/lib/admin-auth";
import { purgeCloudinaryAccount } from "@/lib/cloudinary";
import { generateId } from "@/lib/utils";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

// ─── إحصائيات عامة عن المنصة ─────────────────────────────────────────────────
export async function getPlatformStats() {
  const admin = await getPlatformAdmin();
  if (!admin) return null;

  const [storeCount] = await db.select({ value: count() }).from(organizations);
  const [userCount] = await db.select({ value: count() }).from(users);
  const [orderCount] = await db.select({ value: count() }).from(orders);
  const [productCount] = await db.select({ value: count() }).from(products);

  const planBreakdown = await db
    .select({ plan: subscriptions.plan, value: count() })
    .from(subscriptions)
    .groupBy(subscriptions.plan);

  const revenueByPlan: Record<string, number> = { free: 0, pro: 1500, business: 4500 };
  const monthlyRevenueCents =
    planBreakdown.reduce((sum, row) => sum + (revenueByPlan[row.plan] ?? 0) * row.value, 0) * 100;

  return {
    storeCount: storeCount?.value ?? 0,
    userCount: userCount?.value ?? 0,
    orderCount: orderCount?.value ?? 0,
    productCount: productCount?.value ?? 0,
    planBreakdown,
    monthlyRevenueCents,
  };
}

// ─── قائمة كل المتاجر بالمنصة ─────────────────────────────────────────────────
export async function getAllStores() {
  const admin = await getPlatformAdmin();
  if (!admin) return null;

  return db.query.organizations.findMany({
    with: { subscription: true, storeSettings: true },
    orderBy: desc(organizations.createdAt),
  });
}

// ─── قائمة كل المستخدمين بالمنصة ──────────────────────────────────────────────
export async function getAllUsers() {
  const admin = await getPlatformAdmin();
  if (!admin) return null;

  return db.query.users.findMany({
    columns: { passwordHash: false },
    orderBy: desc(users.createdAt),
  });
}

// ─── حذف متجر (يشمل كل بياناته بقاعدة البيانات تلقائيًا عبر cascade) ───────────
export async function adminDeleteStoreAction(
  orgId: string,
  purgeCloudinary: boolean
): Promise<ActionResult<{ cloudinaryPurged: boolean; cloudinarySkippedReason?: string }>> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  let cloudinaryPurged = false;
  let cloudinarySkippedReason: string | undefined;

  if (purgeCloudinary) {
    const [settings] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.organizationId, orgId));

    if (settings?.cloudinaryCloudName && settings.cloudinaryApiKey && settings.cloudinaryApiSecret) {
      // حساب Cloudinary معزول خاص بهذا المتجر — آمن حذف كل شيء فيه
      const result = await purgeCloudinaryAccount({
        cloudName: settings.cloudinaryCloudName,
        apiKey: settings.cloudinaryApiKey,
        apiSecret: settings.cloudinaryApiSecret,
      });
      cloudinaryPurged = result.success;
      if (!result.success) cloudinarySkippedReason = result.error;
    } else {
      // هذا المتجر على الحساب المشترك — لا يمكن حذف صوره بدون التأثير
      // على صور بقية المتاجر الأخرى على نفس الحساب، فنتجاهل هذه الخطوة عمدًا.
      cloudinarySkippedReason = "هذا المتجر يستخدم حساب Cloudinary المشترك — لا يمكن حذف صوره بأمان بدون التأثير على متاجر أخرى";
    }
  }

  // حذف المتجر من قاعدة البيانات يحذف تلقائيًا: المنتجات، الطلبات، الأعضاء،
  // الدعوات، الاشتراك، الإعدادات، الإشعارات... (كلها onDelete: cascade)
  await db.delete(organizations).where(eq(organizations.id, orgId));

  revalidatePath("/admin/stores");
  return { success: true, data: { cloudinaryPurged, cloudinarySkippedReason } };
}
export async function adminSetStorePlanAction(
  orgId: string,
  plan: "free" | "pro" | "business"
): Promise<ActionResult> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  await db
    .update(subscriptions)
    .set({ plan, status: plan === "free" ? "free" : "active", updatedAt: new Date() })
    .where(eq(subscriptions.organizationId, orgId));

  revalidatePath("/admin/stores");
  return { success: true, data: undefined };
}

// ─── إجراء إشرافي: ضبط/إزالة بيانات Cloudinary مخصصة لمتجر معيّن ────────────────
export async function adminSetStoreCloudinaryAction(
  orgId: string,
  credentials: { cloudName: string; apiKey: string; apiSecret: string }
): Promise<ActionResult> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  const cloudName = credentials.cloudName.trim();
  const apiKey = credentials.apiKey.trim();
  const apiSecret = credentials.apiSecret.trim();

  // لو الثلاثة فارغة، هذا يعني "رجوع للحساب المشترك"
  const allEmpty = !cloudName && !apiKey && !apiSecret;
  const allFilled = cloudName && apiKey && apiSecret;

  if (!allEmpty && !allFilled) {
    return { success: false, error: "إمّا عبّي الحقول الثلاثة كلها، أو خليها فارغة كلها" };
  }

  await db
    .update(storeSettings)
    .set({
      cloudinaryCloudName: allEmpty ? null : cloudName,
      cloudinaryApiKey: allEmpty ? null : apiKey,
      cloudinaryApiSecret: allEmpty ? null : apiSecret,
      updatedAt: new Date(),
    })
    .where(eq(storeSettings.organizationId, orgId));

  revalidatePath("/admin/stores");
  return { success: true, data: undefined };
}

// ─── القائمة السوداء على مستوى المنصة كلها (حماية من الطلبات الوهمية) ──────────
export async function getPlatformBlockedPhonesAction(): Promise<
  ActionResult<{ id: string; phone: string; reason: string | null; createdAt: Date }[]>
> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  const rows = await db
    .select()
    .from(blockedPhones)
    .where(isNull(blockedPhones.organizationId))
    .orderBy(desc(blockedPhones.createdAt));

  return { success: true, data: rows };
}

/** أرقام حظرتها أكثر من متجر مستقل — مؤشر قوي إنها فعلًا محتالة، مرشّحة للحظر الشامل. */
export async function getMultiReportedPhonesAction(): Promise<
  ActionResult<{ phone: string; storeCount: number }[]>
> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  const rows = await db
    .select({ phone: blockedPhones.phone, storeCount: countDistinct(blockedPhones.organizationId) })
    .from(blockedPhones)
    .where(sql`${blockedPhones.organizationId} is not null`)
    .groupBy(blockedPhones.phone)
    .having(sql`count(distinct ${blockedPhones.organizationId}) >= 2`)
    .orderBy(desc(countDistinct(blockedPhones.organizationId)));

  return { success: true, data: rows };
}

export async function adminBlockPhonePlatformWideAction(phone: string, reason?: string): Promise<ActionResult> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  const cleanPhone = phone.trim();
  if (!cleanPhone) return { success: false, error: "رقم الهاتف مطلوب" };

  const [existing] = await db
    .select()
    .from(blockedPhones)
    .where(and(isNull(blockedPhones.organizationId), eq(blockedPhones.phone, cleanPhone)));
  if (existing) return { success: true, data: undefined };

  await db.insert(blockedPhones).values({
    id: generateId(),
    organizationId: null,
    phone: cleanPhone,
    reason: reason?.trim() || "حظر شامل من الأدمن",
  });

  revalidatePath("/admin");
  return { success: true, data: undefined };
}

export async function adminUnblockPhonePlatformWideAction(id: string): Promise<ActionResult> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  await db.delete(blockedPhones).where(and(eq(blockedPhones.id, id), isNull(blockedPhones.organizationId)));

  revalidatePath("/admin");
  return { success: true, data: undefined };
}
