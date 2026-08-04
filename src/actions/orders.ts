"use server";

import { db } from "@/db";
import { orders, memberships, customers, blockedPhones } from "@/db/schema";
import { eq, and, desc, count, inArray, or, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import type { ActionResult } from "./auth";
import { generateId } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function getMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
  return membership;
}

export async function getOrders(orgId: string) {
  const orderList = await db.query.orders.findMany({
    where: eq(orders.organizationId, orgId),
    with: { customer: true, items: true },
    orderBy: desc(orders.createdAt),
  });

  const phones = [...new Set(orderList.map((o) => o.customer?.phone).filter((p): p is string => Boolean(p)))];
  if (phones.length === 0) return orderList.map((o) => ({ ...o, canceledCount: 0, isBlocked: false }));

  // عدد الطلبات الملغاة/المرتجعة سابقًا لكل رقم هاتف بهذا المتجر (مؤشر احتيال)
  const canceledCounts = await db
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
  const blocked = await db
    .select({ phone: blockedPhones.phone })
    .from(blockedPhones)
    .where(and(inArray(blockedPhones.phone, phones), or(eq(blockedPhones.organizationId, orgId), isNull(blockedPhones.organizationId))));

  const blockedSet = new Set(blocked.map((b) => b.phone));

  return orderList.map((o) => ({
    ...o,
    canceledCount: o.customer?.phone ? canceledMap.get(o.customer.phone) ?? 0 : 0,
    isBlocked: o.customer?.phone ? blockedSet.has(o.customer.phone) : false,
  }));
}

// ─── القائمة السوداء لأرقام الهواتف (حماية من الطلبات الوهمية) ─────────────────
export async function getBlockedPhonesAction(orgId: string): Promise<ActionResult<{ id: string; phone: string; reason: string | null; createdAt: Date }[]>> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };

  const rows = await db
    .select()
    .from(blockedPhones)
    .where(eq(blockedPhones.organizationId, orgId))
    .orderBy(desc(blockedPhones.createdAt));

  return { success: true, data: rows };
}

export async function blockPhoneAction(orgId: string, phone: string, reason?: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  const cleanPhone = phone.trim();
  if (!cleanPhone) return { success: false, error: "رقم الهاتف مطلوب" };

  const [existing] = await db
    .select()
    .from(blockedPhones)
    .where(and(eq(blockedPhones.organizationId, orgId), eq(blockedPhones.phone, cleanPhone)));
  if (existing) return { success: true, data: undefined };

  await db.insert(blockedPhones).values({
    id: generateId(),
    organizationId: orgId,
    phone: cleanPhone,
    reason: reason?.trim() || null,
    reportedByOrgId: orgId,
  });

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function unblockPhoneAction(orgId: string, id: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  await db.delete(blockedPhones).where(and(eq(blockedPhones.id, id), eq(blockedPhones.organizationId, orgId)));

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

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
