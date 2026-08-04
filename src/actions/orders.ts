"use server";

import { db } from "@/db";
import { orders, memberships, blockedPhones } from "@/db/schema";
import { eq, and, desc, isNull, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

async function getMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
  return membership;
}

// ─── مؤشرات مخاطر لكل طلب (لعرض تحذيرات COD بلوحة التحكم) ──────────────────────
export interface OrderRiskFlags {
  isBlocked: boolean;
  blockScope: "store" | "platform" | null;
  customerTotalOrders: number;
  customerCanceledOrders: number;
  highCancelRate: boolean;
}

export async function getOrders(orgId: string) {
  const orderList = await db.query.orders.findMany({
    where: eq(orders.organizationId, orgId),
    with: { customer: true, items: true },
    orderBy: desc(orders.createdAt),
  });

  if (!orderList.length) return [] as (typeof orderList[number] & { risk: OrderRiskFlags })[];

  // الأرقام المحظورة (على مستوى هذا المتجر أو على مستوى المنصة)
  const blocked = await db
    .select()
    .from(blockedPhones)
    .where(or(eq(blockedPhones.organizationId, orgId), isNull(blockedPhones.organizationId)));

  const platformBlockedSet = new Set(blocked.filter((b) => b.organizationId === null).map((b) => b.phone));
  const storeBlockedSet = new Set(blocked.filter((b) => b.organizationId === orgId).map((b) => b.phone));

  // إحصاء طلبات كل زبون (إجمالي وملغى) لحساب معدل الإلغاء
  const perCustomer = new Map<string, { total: number; canceled: number }>();
  for (const order of orderList) {
    const stat = perCustomer.get(order.customerId) ?? { total: 0, canceled: 0 };
    stat.total += 1;
    if (order.status === "canceled" || order.status === "refunded") stat.canceled += 1;
    perCustomer.set(order.customerId, stat);
  }

  return orderList.map((order) => {
    const phone = order.customer?.phone ?? "";
    const isBlocked = platformBlockedSet.has(phone) || storeBlockedSet.has(phone);
    const blockScope: "store" | "platform" | null = platformBlockedSet.has(phone)
      ? "platform"
      : storeBlockedSet.has(phone)
        ? "store"
        : null;

    const stat = perCustomer.get(order.customerId) ?? { total: 0, canceled: 0 };
    const highCancelRate = stat.total >= 2 && stat.canceled / stat.total >= 0.5;

    return {
      ...order,
      risk: {
        isBlocked,
        blockScope,
        customerTotalOrders: stat.total,
        customerCanceledOrders: stat.canceled,
        highCancelRate,
      } satisfies OrderRiskFlags,
    };
  });
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
