"use server";

import { db } from "@/db";
import { blockedPhones, memberships } from "@/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { getPlatformAdmin } from "@/lib/admin-auth";
import { requirePermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { normalizePhone } from "@/lib/security";
import { generateId } from "@/lib/utils";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

async function getMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
  return membership;
}

// ─── مستوى المتجر ─────────────────────────────────────────────────────────────
export async function getBlockedPhonesForOrg(orgId: string) {
  return db.query.blockedPhones.findMany({
    where: eq(blockedPhones.organizationId, orgId),
    orderBy: desc(blockedPhones.createdAt),
  });
}

export async function blockPhoneAction(
  orgId: string,
  rawPhone: string,
  reason?: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  const phone = normalizePhone(rawPhone);
  if (!phone) return { success: false, error: "رقم هاتف غير صحيح" };

  const [existing] = await db
    .select()
    .from(blockedPhones)
    .where(and(eq(blockedPhones.organizationId, orgId), eq(blockedPhones.phone, phone)));

  if (existing) return { success: false, error: "هذا الرقم محظور بالفعل في متجرك" };

  await db.insert(blockedPhones).values({
    id: generateId(),
    phone,
    organizationId: orgId,
    reason: reason?.trim() || null,
    blockedByUserId: user.id,
  });

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function unblockPhoneAction(orgId: string, blockId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_orders");

  await db
    .delete(blockedPhones)
    .where(and(eq(blockedPhones.id, blockId), eq(blockedPhones.organizationId, orgId)));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── مستوى المنصة (أدمن makramfy فقط) ─────────────────────────────────────────
export async function getPlatformBlockedPhones() {
  const admin = await getPlatformAdmin();
  if (!admin) return [];

  return db.query.blockedPhones.findMany({
    where: isNull(blockedPhones.organizationId),
    orderBy: desc(blockedPhones.createdAt),
  });
}

// اقتراحات ذكية: أرقام حظرها متجرين مستقلّين أو أكثر (إشارة قوية على احتيال حقيقي
// وليس مجرد خلاف بين تاجر واحد وزبون) وما زالت غير محظورة على مستوى المنصة.
export async function getSmartBlockSuggestions() {
  const admin = await getPlatformAdmin();
  if (!admin) return [];

  const storeBlocks = await db
    .select({ phone: blockedPhones.phone, organizationId: blockedPhones.organizationId })
    .from(blockedPhones)
    .where(sql`${blockedPhones.organizationId} IS NOT NULL`);

  const platformBlocked = new Set(
    (
      await db
        .select({ phone: blockedPhones.phone })
        .from(blockedPhones)
        .where(isNull(blockedPhones.organizationId))
    ).map((r) => r.phone)
  );

  const byPhone = new Map<string, Set<string>>();
  for (const row of storeBlocks) {
    if (!row.organizationId) continue;
    const set = byPhone.get(row.phone) ?? new Set<string>();
    set.add(row.organizationId);
    byPhone.set(row.phone, set);
  }

  return Array.from(byPhone.entries())
    .filter(([phone, orgSet]) => orgSet.size >= 2 && !platformBlocked.has(phone))
    .map(([phone, orgSet]) => ({ phone, storeCount: orgSet.size }))
    .sort((a, b) => b.storeCount - a.storeCount);
}

export async function blockPhonePlatformAction(rawPhone: string, reason?: string): Promise<ActionResult> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  const phone = normalizePhone(rawPhone);
  if (!phone) return { success: false, error: "رقم هاتف غير صحيح" };

  const [existing] = await db
    .select()
    .from(blockedPhones)
    .where(and(isNull(blockedPhones.organizationId), eq(blockedPhones.phone, phone)));

  if (existing) return { success: false, error: "هذا الرقم محظور بالفعل على مستوى المنصة" };

  await db.insert(blockedPhones).values({
    id: generateId(),
    phone,
    organizationId: null,
    reason: reason?.trim() || null,
    blockedByUserId: admin.id,
  });

  revalidatePath("/admin");
  return { success: true, data: undefined };
}

export async function unblockPhonePlatformAction(blockId: string): Promise<ActionResult> {
  const admin = await getPlatformAdmin();
  if (!admin) return { success: false, error: "غير مصرح" };

  await db
    .delete(blockedPhones)
    .where(and(eq(blockedPhones.id, blockId), isNull(blockedPhones.organizationId)));

  revalidatePath("/admin");
  return { success: true, data: undefined };
}
