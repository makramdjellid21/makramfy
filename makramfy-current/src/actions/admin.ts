"use server";

import { db } from "@/db";
import { organizations, subscriptions, users, products, orders } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { getPlatformAdmin } from "@/lib/admin-auth";
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

  const revenueByPlan: Record<string, number> = { free: 0, pro: 2900, business: 9900 };
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

// ─── إجراء إشرافي: تغيير خطة متجر يدويًا (مثلاً تعليق متجر مخالف بإرجاعه Free) ──
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
