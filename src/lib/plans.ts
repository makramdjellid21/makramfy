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
