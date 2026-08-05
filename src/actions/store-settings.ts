"use server";

import { db, withOrgContext } from "@/db";
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
  return withOrgContext(orgId, async (tx) => {
    const [settings] = await tx.select().from(storeSettings).where(eq(storeSettings.organizationId, orgId));
    return settings ?? null;
  });
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
  const email = (formData.get("email") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const announcementText = (formData.get("announcementText") as string)?.trim();
  const socialInstagram = (formData.get("socialInstagram") as string)?.trim();
  const socialFacebook = (formData.get("socialFacebook") as string)?.trim();
  const socialTelegramChannel = (formData.get("socialTelegramChannel") as string)?.trim();
  const socialWhatsapp = (formData.get("socialWhatsapp") as string)?.trim();
  const aboutText = (formData.get("aboutText") as string)?.trim();
  const returnPolicyText = (formData.get("returnPolicyText") as string)?.trim();
  const privacyPolicyText = (formData.get("privacyPolicyText") as string)?.trim();
  const termsText = (formData.get("termsText") as string)?.trim();
  const telegramBotToken = (formData.get("telegramBotToken") as string)?.trim();
  const telegramChatId = (formData.get("telegramChatId") as string)?.trim();
  const facebookPixelId = (formData.get("facebookPixelId") as string)?.trim();

  const values = {
    description: description || null,
    bannerUrl: bannerUrl || null,
    themeColor,
    phone: phone || null,
    email: email || null,
    address: address || null,
    announcementText: announcementText || null,
    socialInstagram: socialInstagram || null,
    socialFacebook: socialFacebook || null,
    socialTelegramChannel: socialTelegramChannel || null,
    socialWhatsapp: socialWhatsapp || null,
    aboutText: aboutText || null,
    returnPolicyText: returnPolicyText || null,
    privacyPolicyText: privacyPolicyText || null,
    termsText: termsText || null,
    telegramBotToken: telegramBotToken || null,
    telegramChatId: telegramChatId || null,
    facebookPixelId: facebookPixelId || null,
    updatedAt: new Date(),
  };

  await withOrgContext(orgId, async (tx) => {
    const [existing] = await tx.select().from(storeSettings).where(eq(storeSettings.organizationId, orgId));

    if (existing) {
      await tx.update(storeSettings).set(values).where(eq(storeSettings.organizationId, orgId));
    } else {
      await tx.insert(storeSettings).values({ id: generateId(), organizationId: orgId, ...values });
    }
  });

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

  await withOrgContext(orgId, async (tx) => {
    const [existing] = await tx.select().from(storeSettings).where(eq(storeSettings.organizationId, orgId));

    if (existing) {
      await tx
        .update(storeSettings)
        .set({ isPublished, updatedAt: new Date() })
        .where(eq(storeSettings.organizationId, orgId));
    } else {
      await tx.insert(storeSettings).values({
        id: generateId(),
        organizationId: orgId,
        isPublished,
        updatedAt: new Date(),
      });
    }
  });

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
