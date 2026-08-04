import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * يحذف كل الصور من حساب Cloudinary مُعطى (عبر REST API مباشرة، بدون التأثير
 * على إعداد Cloudinary العام). آمن الاستخدام فقط مع حسابات معزولة خاصة بمتجر
 * واحد — لا يُستخدم أبدًا مع الحساب المشترك لأنه سيمسح صور كل المتاجر الأخرى.
 */
export async function purgeCloudinaryAccount(credentials: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${credentials.cloudName}/resources/image/upload?all=true`,
      { method: "DELETE", headers: { Authorization: `Basic ${auth}` } }
    );
    if (!res.ok) {
      return { success: false, error: `فشل حذف صور Cloudinary (${res.status})` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل الاتصال بـ Cloudinary" };
  }
}

interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function generateSignature(
  params: Record<string, string | number>,
  overrideCredentials?: CloudinaryCredentials
): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsWithTimestamp = { ...params, timestamp };

  const apiSecret = overrideCredentials?.apiSecret ?? process.env.CLOUDINARY_API_SECRET!;
  const apiKey = overrideCredentials?.apiKey ?? process.env.CLOUDINARY_API_KEY!;
  const cloudName = overrideCredentials?.cloudName ?? process.env.CLOUDINARY_CLOUD_NAME!;

  const signature = cloudinary.utils.api_sign_request(paramsWithTimestamp, apiSecret);

  return { signature, timestamp, apiKey, cloudName };
}

export async function deleteCloudinaryImage(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete Cloudinary image:", error);
  }
}

export function getCloudinaryPublicId(url: string): string | null {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const pathWithVersion = parts[1];
    // Remove version prefix if present (v1234567/)
    const path = pathWithVersion.replace(/^v\d+\//, "");
    // Remove extension
    return path.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}
