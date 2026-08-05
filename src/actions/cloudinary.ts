"use server";

import { db, withOrgContext } from "@/db";
import { usageRecords, storeSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { generateSignature } from "@/lib/cloudinary";
import { canUploadFile, getPlanLimits, type Plan } from "@/lib/plans";
import { getOrgData } from "./organizations";
import type { ActionResult } from "./auth";

export async function getCloudinarySignatureAction(
  folder: string = "makramfy",
  orgId?: string,
  fileSizeBytes?: number
): Promise<
  ActionResult<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
  }>
> {
  await requireAuth();

  // إن كان عند هذا المتجر بيانات Cloudinary مخصصة (مضبوطة من لوحة الأدمن)، نستخدمها
  let overrideCredentials: { cloudName: string; apiKey: string; apiSecret: string } | undefined;
  if (orgId) {
    const [settings] = await withOrgContext(orgId, (tx) =>
      tx.select().from(storeSettings).where(eq(storeSettings.organizationId, orgId))
    );

    if (settings?.cloudinaryCloudName && settings.cloudinaryApiKey && settings.cloudinaryApiSecret) {
      overrideCredentials = {
        cloudName: settings.cloudinaryCloudName,
        apiKey: settings.cloudinaryApiKey,
        apiSecret: settings.cloudinaryApiSecret,
      };
    }
  }

  if (!overrideCredentials && (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME)) {
    return { success: false, error: "Cloudinary غير مُهيأ" };
  }

  if (orgId && fileSizeBytes) {
    const { sub, usage } = await getOrgData(orgId);
    const plan = (sub?.plan ?? "free") as Plan;
    const currentBytes = usage?.storageUsedBytes ?? 0;

    if (!canUploadFile(plan, currentBytes, fileSizeBytes)) {
      const limit = getPlanLimits(plan).maxStorageBytes;
      const usedMb = Math.round(currentBytes / 1024 / 1024);
      const limitMb = Math.round(limit / 1024 / 1024);
      return {
        success: false,
        error: `وصلت لحد التخزين المسموح (${usedMb}MB من ${limitMb}MB). يرجى ترقية خطتك لرفع المزيد.`,
      };
    }
  }

  const { signature, timestamp, apiKey, cloudName } = generateSignature({ folder }, overrideCredentials);

  return {
    success: true,
    data: { signature, timestamp, apiKey, cloudName, folder },
  };
}

/** تُستدعى بعد نجاح رفع الملف فعليًا لتحديث استهلاك التخزين للمتجر. */
export async function recordUploadUsageAction(orgId: string, bytes: number): Promise<ActionResult> {
  await requireAuth();

  await db
    .update(usageRecords)
    .set({ storageUsedBytes: sql`storage_used_bytes + ${bytes}`, updatedAt: new Date() })
    .where(eq(usageRecords.organizationId, orgId));

  return { success: true, data: undefined };
}
