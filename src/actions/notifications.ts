"use server";

import { db } from "@/db";
import { notifications, memberships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import type { ActionResult } from "./auth";

async function getMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
  return membership;
}

/** يُستدعى داخليًا من إجراءات أخرى (طلب جديد، عضو انضم...) — ليس Server Action مباشر. */
export async function createNotification(
  organizationId: string,
  type: "order" | "member" | "system",
  title: string,
  message?: string,
  link?: string
) {
  await db.insert(notifications).values({
    id: generateId(),
    organizationId,
    type,
    title,
    message: message ?? null,
    link: link ?? null,
  });
}

export async function getNotificationsAction(
  orgId: string
): Promise<ActionResult<{ id: string; type: string; title: string; message: string | null; link: string | null; isRead: boolean; createdAt: Date }[]>> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.organizationId, orgId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return { success: true, data: rows };
}

export async function markNotificationReadAction(orgId: string, id: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.organizationId, orgId)));

  return { success: true, data: undefined };
}

export async function markAllNotificationsReadAction(orgId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.organizationId, orgId), eq(notifications.isRead, false)));

  return { success: true, data: undefined };
}
