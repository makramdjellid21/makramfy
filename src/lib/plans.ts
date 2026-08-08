import { formatBytes } from "./utils";

export type Plan = "free" | "pro" | "business";

export interface PlanLimits {
  maxMembers: number;
  maxStorageBytes: number;
  maxProducts: number;
  label: string;
  price: number; // DZD/month
  priceId?: string;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    label: "مجاني",
    price: 0,
    maxMembers: 1,
    maxStorageBytes: 250 * 1024 * 1024, // 250MB
    maxProducts: 15,
  },
  pro: {
    label: "احترافي",
    price: 1500,
    maxMembers: 5,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    maxProducts: Infinity,
  },
  business: {
    label: "أعمال",
    price: 4500,
    maxMembers: Infinity,
    maxStorageBytes: 25 * 1024 * 1024 * 1024, // 25GB
    maxProducts: Infinity,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canAddMember(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxMembers;
}

export function canAddProduct(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxProducts;
}

export function canUploadFile(plan: Plan, currentBytes: number, fileBytes: number): boolean {
  return currentBytes + fileBytes <= PLAN_LIMITS[plan].maxStorageBytes;
}

export function getUpgradeMessage(resource: "member" | "storage" | "product", plan: Plan): string {
  const messages = {
    member: `وصلت إلى الحد الأقصى لعدد الأعضاء في خطة ${PLAN_LIMITS[plan].label}.`,
    storage: `وصلت إلى الحد الأقصى لمساحة التخزين في خطة ${PLAN_LIMITS[plan].label}.`,
    product: `وصلت إلى الحد الأقصى لعدد المنتجات في خطة ${PLAN_LIMITS[plan].label}.`,
  };
  return messages[resource] + " يرجى ترقية خطتك للمتابعة.";
}

// ─── تفاصيل تسويقية موحّدة (تُستخدم بصفحة الأسعار العامة وصفحة الفوترة بالداشبورد) ──
export interface PlanMarketingDetails {
  key: Plan;
  label: string;
  price: number;
  popular: boolean;
  description: string;
  features: string[];
}

export const PLAN_ORDER: Plan[] = ["free", "pro", "business"];

export const PLAN_MARKETING_DETAILS: Record<Plan, PlanMarketingDetails> = {
  free: {
    key: "free",
    label: PLAN_LIMITS.free.label,
    price: PLAN_LIMITS.free.price,
    popular: false,
    description: "مثالي للانطلاقة الأولى وتجربة المنصة بدون أي التزام.",
    features: [
      "عضو واحد",
      `${PLAN_LIMITS.free.maxProducts} منتج كحد أقصى`,
      `${formatBytes(PLAN_LIMITS.free.maxStorageBytes)} مساحة تخزين`,
      "الدفع عند الاستلام",
      "لوحة تحكم كاملة",
      'شعار "مبني عبر MakramFy" ظاهر بالمتجر',
    ],
  },
  pro: {
    key: "pro",
    label: PLAN_LIMITS.pro.label,
    price: PLAN_LIMITS.pro.price,
    popular: true,
    description: "للتجار الجادين اللي يبيعون بشكل يومي ومحتاجين فريق صغير.",
    features: [
      `حتى ${PLAN_LIMITS.pro.maxMembers} أعضاء في الفريق`,
      "منتجات غير محدودة",
      `${formatBytes(PLAN_LIMITS.pro.maxStorageBytes)} مساحة تخزين`,
      "الدفع عند الاستلام + دفع أونلاين (EDAHABIA/CIB)",
      "بدون شعار MakramFy — علامتك التجارية فقط",
      "ألوان ومتغيرات منتج (لون، مقاس...) غير محدودة",
    ],
  },
  business: {
    key: "business",
    label: PLAN_LIMITS.business.label,
    price: PLAN_LIMITS.business.price,
    popular: false,
    description: "للمتاجر الكبيرة والفرق متعددة الأعضاء اللي تدير عدة أشخاص.",
    features: [
      "أعضاء غير محدودين في الفريق",
      "منتجات غير محدودة",
      `${formatBytes(PLAN_LIMITS.business.maxStorageBytes)} مساحة تخزين`,
      "الدفع عند الاستلام + دفع أونلاين (EDAHABIA/CIB)",
      "بدون شعار MakramFy",
      "صلاحيات فريق متقدمة (مالك، مدير، عضو)",
    ],
  },
};
