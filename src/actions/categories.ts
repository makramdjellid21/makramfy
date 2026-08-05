"use server";

import { db, withOrgContext } from "@/db";
import { categories, memberships } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { generateId, generateSlug } from "@/lib/utils";
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

export async function getCategories(orgId: string) {
  return withOrgContext(orgId, (tx) =>
    tx.select().from(categories).where(eq(categories.organizationId, orgId)).orderBy(asc(categories.name))
  );
}

export async function createCategoryAction(
  orgId: string,
  formData: FormData
): Promise<ActionResult<{ categoryId: string }>> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_categories");

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2) {
    return { success: false, error: "اسم التصنيف يجب أن يكون حرفين على الأقل" };
  }

  return withOrgContext(orgId, async (tx) => {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const [existing] = await tx
        .select()
        .from(categories)
        .where(and(eq(categories.organizationId, orgId), eq(categories.slug, slug)));
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const categoryId = generateId();
    await tx.insert(categories).values({ id: categoryId, organizationId: orgId, name, slug });

    revalidatePath("/dashboard");
    return { success: true, data: { categoryId } };
  });
}

export async function deleteCategoryAction(orgId: string, categoryId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "manage_categories");

  await withOrgContext(orgId, (tx) =>
    tx.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.organizationId, orgId)))
  );

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
