"use server";

import { db } from "@/db";
import { orders, memberships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

export async function getOrders(orgId: string) {
  return db.query.orders.findMany({
    where: eq(orders.organizationId, orgId),
    with: { customer: true, items: true },
    orderBy: desc(orders.createdAt),
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
