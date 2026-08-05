"use server";

import { db, withOrgContext } from "@/db";
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
  return withOrgContext(orgId, (tx) =>
    tx.query.products.findMany({
      where: eq(products.organizationId, orgId),
      with: { category: true, variants: true },
      orderBy: desc(products.createdAt),
    })
  );
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

  // subscriptions/usage_records خارج نطاق RLS حاليًا (راجع rls-policies.sql)
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
  const imagesRaw = formData.get("images") as string | null;
  let images: string[] = [];
  try {
    images = imagesRaw ? (JSON.parse(imagesRaw) as string[]).filter(Boolean) : [];
  } catch {
    images = [];
  }
  const categoryId = (formData.get("categoryId") as string) || null;
  const priceDzd = Number(formData.get("price"));
  const stockQuantity = Number(formData.get("stockQuantity")) || 0;

  if (!name || name.length < 2) {
    return { success: false, error: "اسم المنتج يجب أن يكون حرفين على الأقل" };
  }
  if (!priceDzd || priceDzd <= 0) {
    return { success: false, error: "السعر يجب أن يكون أكبر من صفر" };
  }

  const productId = await withOrgContext(orgId, async (tx) => {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const [existing] = await tx
        .select()
        .from(products)
        .where(and(eq(products.organizationId, orgId), eq(products.slug, slug)));
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const id = generateId();

    await tx.insert(products).values({
      id,
      organizationId: orgId,
      categoryId,
      name,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
      images,
      basePriceCents: Math.round(priceDzd * 100),
      isActive: true,
      updatedAt: new Date(),
    });

    // متغير افتراضي واحد يحمل المخزون (يمكن إضافة متغيرات أخرى لاحقًا)
    await tx.insert(productVariants).values({
      id: generateId(),
      productId: id,
      name: "افتراضي",
      stockQuantity,
    });

    return id;
  });

  // usage_records خارج نطاق RLS حاليًا
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
  const imagesRaw = formData.get("images") as string | null;
  let images: string[] = [];
  try {
    images = imagesRaw ? (JSON.parse(imagesRaw) as string[]).filter(Boolean) : [];
  } catch {
    images = [];
  }
  const categoryId = (formData.get("categoryId") as string) || null;
  const priceDzd = Number(formData.get("price"));

  if (!name || name.length < 2) {
    return { success: false, error: "اسم المنتج يجب أن يكون حرفين على الأقل" };
  }
  if (!priceDzd || priceDzd <= 0) {
    return { success: false, error: "السعر يجب أن يكون أكبر من صفر" };
  }

  await withOrgContext(orgId, (tx) =>
    tx
      .update(products)
      .set({
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        images,
        categoryId,
        basePriceCents: Math.round(priceDzd * 100),
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.organizationId, orgId)))
  );

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

  await withOrgContext(orgId, (tx) =>
    tx
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.organizationId, orgId)))
  );

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

  await withOrgContext(orgId, (tx) =>
    tx
      .update(products)
      .set({ isFeatured, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.organizationId, orgId)))
  );

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

  await withOrgContext(orgId, (tx) =>
    tx
      .update(productVariants)
      .set({ stockQuantity: Math.max(0, stockQuantity) })
      .where(eq(productVariants.productId, productId))
  );

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── إدارة المتغيرات (لون / مقاس / طراز...) ──────────────────────────────────────
export async function addProductVariantAction(
  orgId: string,
  productId: string,
  data: { name: string; priceCents: number | null; stockQuantity: number; imageUrl: string | null }
): Promise<ActionResult<{ variantId: string }>> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  if (!data.name.trim()) {
    return { success: false, error: "اسم المتغيّر مطلوب (مثال: أحمر - L)" };
  }

  const result = await withOrgContext(orgId, async (tx) => {
    const [product] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.organizationId, orgId)));
    if (!product) return null;

    const variantId = generateId();
    await tx.insert(productVariants).values({
      id: variantId,
      productId,
      name: data.name.trim(),
      priceCents: data.priceCents,
      stockQuantity: Math.max(0, data.stockQuantity),
      imageUrl: data.imageUrl || null,
    });

    return variantId;
  });

  if (!result) return { success: false, error: "المنتج غير موجود" };

  revalidatePath("/dashboard");
  return { success: true, data: { variantId: result } };
}

export async function updateProductVariantAction(
  orgId: string,
  variantId: string,
  data: { name: string; priceCents: number | null; stockQuantity: number; imageUrl: string | null }
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  if (!data.name.trim()) {
    return { success: false, error: "اسم المتغيّر مطلوب" };
  }

  await withOrgContext(orgId, (tx) =>
    tx
      .update(productVariants)
      .set({
        name: data.name.trim(),
        priceCents: data.priceCents,
        stockQuantity: Math.max(0, data.stockQuantity),
        imageUrl: data.imageUrl || null,
      })
      .where(eq(productVariants.id, variantId))
  );

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function deleteProductVariantAction(
  orgId: string,
  productId: string,
  variantId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_products");

  const result = await withOrgContext(orgId, async (tx) => {
    const remaining = await tx.select().from(productVariants).where(eq(productVariants.productId, productId));

    if (remaining.length <= 1) {
      return { success: false, error: "لا يمكن حذف آخر متغيّر — يجب أن يبقى للمنتج متغيّر واحد على الأقل" } as const;
    }

    await tx.delete(productVariants).where(eq(productVariants.id, variantId));
    return { success: true } as const;
  });

  if (!result.success) return { success: false, error: result.error };

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

  await withOrgContext(orgId, (tx) =>
    tx.delete(products).where(and(eq(products.id, productId), eq(products.organizationId, orgId)))
  );

  // usage_records خارج نطاق RLS حاليًا
  await db
    .update(usageRecords)
    .set({ productCount: sql`GREATEST(product_count - 1, 0)` })
    .where(eq(usageRecords.organizationId, orgId));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
