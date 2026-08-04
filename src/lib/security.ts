import { db } from "@/db";
import { blockedPhones, orders, customers, loginAttempts, checkoutAttempts } from "@/db/schema";
import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { headers } from "next/headers";

// ─── عنوان IP الحقيقي للطالب (خلف أي proxy/CDN) ────────────────────────────────
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// ─── تطبيع رقم الهاتف ───────────────────────────────────────────────────────
// نوحّد الشكل (نحذف المسافات/الشرطات، ونحوّل 0xxxxxxxxx و +213xxxxxxxxx لنفس
// الصيغة) حتى ما يفوت رقم محظور بسبب اختلاف الكتابة فقط.
export function normalizePhone(raw: string): string {
  let phone = raw.trim().replace(/[\s-]/g, "");
  if (phone.startsWith("+213")) phone = "0" + phone.slice(4);
  else if (phone.startsWith("00213")) phone = "0" + phone.slice(5);
  else if (phone.startsWith("213") && phone.length === 12) phone = "0" + phone.slice(3);
  return phone;
}

// ─── فحص الحظر (متجر + منصة) ────────────────────────────────────────────────
export interface BlockCheckResult {
  blocked: boolean;
  scope: "store" | "platform" | null;
  reason: string | null;
}

export async function checkPhoneBlocked(
  organizationId: string,
  rawPhone: string
): Promise<BlockCheckResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { blocked: false, scope: null, reason: null };

  const rows = await db
    .select()
    .from(blockedPhones)
    .where(
      and(
        eq(blockedPhones.phone, phone),
        or(eq(blockedPhones.organizationId, organizationId), isNull(blockedPhones.organizationId))
      )
    );

  if (!rows.length) return { blocked: false, scope: null, reason: null };

  // نعطي الأولوية لحظر المنصة (أخطر) في الرسالة المعروضة
  const platformBlock = rows.find((r) => r.organizationId === null);
  const chosen = platformBlock ?? rows[0];

  return {
    blocked: true,
    scope: platformBlock ? "platform" : "store",
    reason: chosen.reason ?? null,
  };
}

// ─── فحص سرعة الطلبات المشبوهة (نفس الرقم يكرر طلبات خلال وقت قصير) ─────────
// يُحسب على مستوى المنصة كاملة (وليس متجرًا واحدًا فقط) لأن المحتال الحقيقي
// غالبًا يجرب نفس الرقم على عدة متاجر بالتوازي، وليس متجرًا واحدًا فقط.
const VELOCITY_WINDOW_MINUTES = 60;
const VELOCITY_MAX_ORDERS = 4;

export async function checkOrderVelocity(
  rawPhone: string
): Promise<{ suspicious: boolean; recentCount: number }> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { suspicious: false, recentCount: 0 };

  const since = new Date(Date.now() - VELOCITY_WINDOW_MINUTES * 60 * 1000);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(and(eq(customers.phone, phone), gte(orders.createdAt, since)));

  const recentCount = row?.count ?? 0;
  return { suspicious: recentCount >= VELOCITY_MAX_ORDERS, recentCount };
}

// ─── Rate limiting لتسجيل الدخول (مخزّن بقاعدة البيانات، يشتغل عبر أي عدد Instances) ─
const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX_ATTEMPTS = 8;

export async function checkLoginRateLimit(
  identifierKey: string
): Promise<{ allowed: boolean; retryAfterMinutes: number }> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.identifierKey, identifierKey), gte(loginAttempts.createdAt, since)));

  const count = row?.count ?? 0;
  return {
    allowed: count < LOGIN_MAX_ATTEMPTS,
    retryAfterMinutes: LOGIN_WINDOW_MINUTES,
  };
}

export async function recordLoginAttempt(identifierKey: string, success: boolean) {
  await db.insert(loginAttempts).values({
    id: crypto.randomUUID(),
    identifierKey,
    success,
  });

  // تنظيف خفيف للسجلات القديمة حتى لا يكبر الجدول إلى ما لا نهاية (best-effort)
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.delete(loginAttempts).where(sql`${loginAttempts.createdAt} < ${cutoff}`);
  } catch {
    // تنظيف اختياري، ما نوقف تسجيل الدخول لو فشل
  }
}

// ─── Rate limiting على إنشاء الطلبات (checkout) حسب IP ─────────────────────────
// يمنع بوت من إغراق أي متجر بطلبات وهمية عبر أرقام هواتف عشوائية مختلفة —
// فحص السرعة حسب الرقم (checkOrderVelocity) وحده لا يكفي لأنه ينطلي فقط
// على من يعيد استخدام نفس الرقم.
const CHECKOUT_WINDOW_MINUTES = 10;
const CHECKOUT_MAX_ATTEMPTS = 6;

export async function checkCheckoutRateLimit(
  identifierKey: string
): Promise<{ allowed: boolean; retryAfterMinutes: number }> {
  const since = new Date(Date.now() - CHECKOUT_WINDOW_MINUTES * 60 * 1000);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(checkoutAttempts)
    .where(and(eq(checkoutAttempts.identifierKey, identifierKey), gte(checkoutAttempts.createdAt, since)));

  const count = row?.count ?? 0;
  return {
    allowed: count < CHECKOUT_MAX_ATTEMPTS,
    retryAfterMinutes: CHECKOUT_WINDOW_MINUTES,
  };
}

export async function recordCheckoutAttempt(identifierKey: string) {
  await db.insert(checkoutAttempts).values({
    id: crypto.randomUUID(),
    identifierKey,
  });

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.delete(checkoutAttempts).where(sql`${checkoutAttempts.createdAt} < ${cutoff}`);
  } catch {
    // تنظيف اختياري، ما نوقف الطلب لو فشل
  }
}
