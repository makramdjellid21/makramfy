import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    // نحتفظ بالحروف (عربي/لاتيني) والأرقام والمسافات والشرطات فقط
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // لو الاسم رموز فقط (نادر)، نرجع معرف عشوائي قصير بدل slug فاضي
  return slug || `store-${generateId().slice(0, 8)}`;
}

/**
 * سلاق خاص بأسماء المتاجر (Organizations) فقط — لأنه يُستخدم كـ subdomain حقيقي
 * (مثال: store-name.makramfy.com)، والأحرف غير اللاتينية تكسر النطاقات الفرعية
 * في أغلب المتصفحات وأنظمة DNS. لذلك نحتفظ بالأحرف اللاتينية والأرقام فقط.
 */
export function generateOrgSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `store-${generateId().slice(0, 8)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
