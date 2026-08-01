"use server";

import { db } from "@/db";
import { subscriptions, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { getMembershipRole } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { createChargilyCheckout } from "@/lib/chargily";
import { PLAN_LIMITS } from "@/lib/plans";
import type { ActionResult } from "./auth";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? `http://${ROOT_DOMAIN}`;

// ─── إنشاء عملية دفع Chargily لترقية خطة اشتراك المتجر ────────────────────────
export async function createSubscriptionCheckoutAction(
  orgId: string,
  plan: "pro" | "business"
): Promise<ActionResult<{ url: string }>> {
  const user = await requireAuth();
  const role = await getMembershipRole(user.id, orgId);
  if (!role) return { success: false, error: "غير مصرح" };
  requirePermission(role as Role, "manage_billing");

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  if (!org) return { success: false, error: "المتجر غير موجود" };

  const amount = PLAN_LIMITS[plan].price;
  if (!amount) return { success: false, error: "خطة الاشتراك غير متوفرة" };

  const result = await createChargilyCheckout({
    amount,
    successUrl: `${APP_URL}/dashboard/${org.slug}/billing?success=1`,
    failureUrl: `${APP_URL}/dashboard/${org.slug}/billing?failed=1`,
    description: `اشتراك خطة ${PLAN_LIMITS[plan].label} - ${org.name}`,
    metadata: { type: "subscription", organizationId: orgId, plan },
  });

  if (!result.success) return { success: false, error: result.error };

  return { success: true, data: { url: result.checkout.checkout_url } };
}
