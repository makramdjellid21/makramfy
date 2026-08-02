"use server";

import { requireAuth } from "@/lib/auth";
import { generateSignature } from "@/lib/cloudinary";
import type { ActionResult } from "./auth";

export async function getCloudinarySignatureAction(
  folder: string = "makramfy"
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

  if (
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !process.env.CLOUDINARY_CLOUD_NAME
  ) {
    return { success: false, error: "Cloudinary غير مُهيأ" };
  }

  const { signature, timestamp, apiKey, cloudName } = generateSignature({ folder });

  return {
    success: true,
    data: { signature, timestamp, apiKey, cloudName, folder },
  };
}
