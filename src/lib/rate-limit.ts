import { db } from "@/db";
import { loginAttempts, checkoutAttempts } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { headers } from "next/headers";

// ─── عنوان IP الحقيقي للطالب (خلف أي proxy/CDN مثل Vercel) ─────────────────────
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// ─── Rate limiting لتسجيل الدخول ────────────────────────────────────────────────
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
  return { allowed: count < LOGIN_MAX_ATTEMPTS, retryAfterMinutes: LOGIN_WINDOW_MINUTES };
}

export async function recordLoginAttempt(identifierKey: string, success: boolean) {
  await db.insert(loginAttempts).values({ id: crypto.randomUUID(), identifierKey, success });

  // تنظيف خفيف للسجلات القديمة حتى لا يكبر الجدول إلى ما لا نهاية (best-effort)
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.delete(loginAttempts).where(sql`${loginAttempts.createdAt} < ${cutoff}`);
  } catch {
    // تنظيف اختياري، ما نوقف تسجيل الدخول لو فشل
  }
}

// ─── Rate limiting على إنشاء الطلبات (checkout) حسب IP ─────────────────────────
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
  return { allowed: count < CHECKOUT_MAX_ATTEMPTS, retryAfterMinutes: CHECKOUT_WINDOW_MINUTES };
}

export async function recordCheckoutAttempt(identifierKey: string) {
  await db.insert(checkoutAttempts).values({ id: crypto.randomUUID(), identifierKey });

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.delete(checkoutAttempts).where(sql`${checkoutAttempts.createdAt} < ${cutoff}`);
  } catch {
    // تنظيف اختياري، ما نوقف الطلب لو فشل
  }
}
