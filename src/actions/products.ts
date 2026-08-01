"use server";

import { db } from "@/db";
import { products, productVariants, memberships, subscriptions, usageRecords } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { generateId, generateSlug } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import type { Plan } from "@/lib/plans";
import { canAddProduct } from "@/lib/plans";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

async function getMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
  return membership;
}

// ─── Get Products (with category + variants) ──────────────────────────────────
export async function getProducts(orgId: string) {
  const list = await db.query.products.findMany({
    where: eq(products.organizationId, orgId),
    with: { category: true, variants: true },
    orderBy: desc(products.createdAt),
  });
  return list;
}

// ─── Create Product ─────────────────────────────────────────────────────────────
export async function createProductAction(
  orgId: string,
  formData: FormData
): Promise<ActionResult<{ productId: string }>> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, orgId));
  const [usage] = await db.select().from(usageRecords).where(eq(usageRecords.organizationId, orgId));
  const plan = (sub?.plan ?? "free") as Plan;
  const currentCount = usage?.productCount ?? 0;

  if (!canAddProduct(plan, currentCount)) {
    return { success: false, error: "وصلت إلى الحد الأقصى لعدد المنتجات. يرجى ترقية خطتك." };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const imageUrl = formData.get("imageUrl") as string;
  const categoryId = (formData.get("categoryId") as string) || null;
  const priceDzd = Number(formData.get("price"));
  const stockQuantity = Number(formData.get("stockQuantity")) || 0;

  if (!name || name.length < 2) {
    return { success: false, error: "اسم المنتج يجب أن يكون حرفين على الأقل" };
  }
  if (!priceDzd || priceDzd <= 0) {
    return { success: false, error: "السعر يجب أن يكون أكبر من صفر" };
  }

  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const [existing] = await db
      .select()
      .from(products)
      .where(and(eq(products.organizationId, orgId), eq(products.slug, slug)));
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const productId = generateId();

  await db.insert(products).values({
    id: productId,
    organizationId: orgId,
    categoryId,
    name,
    slug,
    description: description || null,
    imageUrl: imageUrl || null,
    basePriceCents: Math.round(priceDzd * 100),
    isActive: true,
    updatedAt: new Date(),
  });

  // متغير افتراضي واحد يحمل المخزون (يمكن إضافة متغيرات أخرى لاحقًا)
  await db.insert(productVariants).values({
    id: generateId(),
    productId,
    name: "افتراضي",
    stockQuantity,
  });

  await db
    .update(usageRecords)
    .set({ productCount: sql`product_count + 1` })
    .where(eq(usageRecords.organizationId, orgId));

  revalidatePath("/dashboard");
  return { success: true, data: { productId } };
}

// ─── Update Product ─────────────────────────────────────────────────────────────
export async function updateProductAction(
  orgId: string,
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const imageUrl = formData.get("imageUrl") as string;
  const categoryId = (formData.get("categoryId") as string) || null;
  const priceDzd = Number(formData.get("price"));

  if (!name || name.length < 2) {
    return { success: false, error: "اسم المنتج يجب أن يكون حرفين على الأقل" };
  }
  if (!priceDzd || priceDzd <= 0) {
    return { success: false, error: "السعر يجب أن يكون أكبر من صفر" };
  }

  await db
    .update(products)
    .set({
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      categoryId,
      basePriceCents: Math.round(priceDzd * 100),
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.organizationId, orgId)));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Toggle Product Active ───────────────────────────────────────────────────────
export async function toggleProductActiveAction(
  orgId: string,
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  await db
    .update(products)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.organizationId, orgId)));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Toggle Product Featured ──────────────────────────────────────────────────
export async function toggleProductFeaturedAction(
  orgId: string,
  productId: string,
  isFeatured: boolean
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  await db
    .update(products)
    .set({ isFeatured, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.organizationId, orgId)));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Update Stock (المتغير الافتراضي) ────────────────────────────────────────────
export async function updateStockAction(
  orgId: string,
  productId: string,
  stockQuantity: number
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  await db
    .update(productVariants)
    .set({ stockQuantity: Math.max(0, stockQuantity) })
    .where(eq(productVariants.productId, productId));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Delete Product ──────────────────────────────────────────────────────────────
export async function deleteProductAction(
  orgId: string,
  productId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "delete_product");

  await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.organizationId, orgId)));

  await db
    .update(usageRecords)
    .set({ productCount: sql`GREATEST(product_count - 1, 0)` })
    .where(eq(usageRecords.organizationId, orgId));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
