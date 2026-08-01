"use server";

import { db } from "@/db";
import { storeSettings, memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { generateId } from "@/lib/utils";
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

export async function getStoreSettings(orgId: string) {
  const [settings] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.organizationId, orgId));
  return settings ?? null;
}

export async function updateStoreSettingsAction(
  orgId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_store_settings");

  const description = (formData.get("description") as string)?.trim();
  const bannerUrl = formData.get("bannerUrl") as string;
  const themeColor = (formData.get("themeColor") as string) || "#16a34a";
  const phone = (formData.get("phone") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const telegramBotToken = (formData.get("telegramBotToken") as string)?.trim();
  const telegramChatId = (formData.get("telegramChatId") as string)?.trim();
  const facebookPixelId = (formData.get("facebookPixelId") as string)?.trim();

  const [existing] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.organizationId, orgId));

  const values = {
    description: description || null,
    bannerUrl: bannerUrl || null,
    themeColor,
    phone: phone || null,
    address: address || null,
    telegramBotToken: telegramBotToken || null,
    telegramChatId: telegramChatId || null,
    facebookPixelId: facebookPixelId || null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(storeSettings).set(values).where(eq(storeSettings.organizationId, orgId));
  } else {
    await db.insert(storeSettings).values({ id: generateId(), organizationId: orgId, ...values });
  }

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function testTelegramNotificationAction(
  orgId: string,
  botToken: string,
  chatId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_store_settings");

  const { sendTelegramMessage } = await import("@/lib/telegram");
  const result = await sendTelegramMessage(
    botToken,
    chatId,
    "✅ تم ربط إشعارات Telegram بنجاح مع متجرك على MakramFy!"
  );

  if (!result.success) return { success: false, error: result.error ?? "فشل الإرسال" };
  return { success: true, data: undefined };
}

export async function toggleStorePublishedAction(
  orgId: string,
  isPublished: boolean
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_store_settings");

  const [existing] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.organizationId, orgId));

  if (existing) {
    await db
      .update(storeSettings)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(storeSettings.organizationId, orgId));
  } else {
    await db.insert(storeSettings).values({
      id: generateId(),
      organizationId: orgId,
      isPublished,
      updatedAt: new Date(),
    });
  }

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
