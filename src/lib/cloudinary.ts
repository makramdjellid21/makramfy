import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

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
