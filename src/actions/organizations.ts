"use server";

import { db } from "@/db";
import {
  organizations,
  memberships,
  subscriptions,
  usageRecords,
  products,
  orders,
  invitations,
  storeSettings,
} from "@/db/schema";
import { eq, and, count, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { generateId, generateOrgSlug } from "@/lib/utils";
import { requirePermission, hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import type { Plan } from "@/lib/plans";
import { canAddMember } from "@/lib/plans";
import type { ActionResult } from "./auth";
import { sendInviteEmail } from "@/lib/email";
import { createNotification } from "./notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Helper: get user's membership in org ─────────────────────────────────────
async function getMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
  return membership;
}

// ─── Helper: get org with subscription and usage ───────────────────────────────
export async function getOrgData(orgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId));

  const [usage] = await db
    .select()
    .from(usageRecords)
    .where(eq(usageRecords.organizationId, orgId));

  return { org, sub, usage };
}

// ─── Create Organization ───────────────────────────────────────────────────────
export async function createOrganizationAction(
  formData: FormData
): Promise<ActionResult<{ orgId: string; slug: string }>> {
  const user = await requireAuth();
  const name = (formData.get("name") as string)?.trim();
  const slugSource = (formData.get("slug") as string)?.trim();

  if (!name || name.length < 2) {
    return { success: false, error: "اسم المتجر يجب أن يكون حرفين على الأقل" };
  }

  const latinCandidate = (slugSource || name).replace(/[^a-zA-Z0-9\s-]/g, "").trim();
  if (!latinCandidate) {
    return {
      success: false,
      error: "رابط المتجر يجب أن يكون بأحرف إنجليزية وأرقام فقط (مثال: my-store)، لأنه سيُستخدم كرابط لمتجرك",
    };
  }

  const baseSlug = generateOrgSlug(latinCandidate);
  let slug = baseSlug;

  // Ensure unique slug
  let attempt = 0;
  while (true) {
    const [existing] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug));
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const orgId = generateId();
  const membershipId = generateId();
  const subId = generateId();
  const usageId = generateId();

  await db.insert(organizations).values({
    id: orgId,
    name,
    slug,
    updatedAt: new Date(),
  });

  await db.insert(memberships).values({
    id: membershipId,
    userId: user.id,
    organizationId: orgId,
    role: "OWNER",
    updatedAt: new Date(),
  });

  await db.insert(subscriptions).values({
    id: subId,
    organizationId: orgId,
    plan: "free",
    status: "free",
    updatedAt: new Date(),
  });

  await db.insert(usageRecords).values({
    id: usageId,
    organizationId: orgId,
    memberCount: 1,
    storageUsedBytes: 0,
    productCount: 0,
  });

  await db.insert(storeSettings).values({
    id: generateId(),
    organizationId: orgId,
    isPublished: false,
    updatedAt: new Date(),
  });

  revalidatePath("/dashboard");
  return { success: true, data: { orgId, slug } };
}

// ─── Get User Organizations ────────────────────────────────────────────────────
export async function getUserOrganizations() {
  const user = await requireAuth();

  const result = await db
    .select({
      org: organizations,
      membership: memberships,
      sub: subscriptions,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
    .where(eq(memberships.userId, user.id));

  return result;
}

// ─── Get Organization Members ──────────────────────────────────────────────────
export async function getOrgMembers(orgSlug: string) {
  const user = await requireAuth();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug));

  if (!org) throw new Error("المتجر غير موجود");

  const membership = await getMembership(user.id, org.id);
  if (!membership) throw new Error("FORBIDDEN");

  const members = await db
    .select({
      membership: memberships,
      user: {
        id: organizations.id,
        email: sql<string>`u.email`,
        name: sql<string>`u.name`,
        imageUrl: sql<string>`u.image_url`,
      },
    })
    .from(memberships)
    .innerJoin(
      sql`users u`,
      sql`memberships.user_id = u.id`
    )
    .where(eq(memberships.organizationId, org.id));

  return { org, members, myRole: membership.role };
}

// ─── Invite Member ─────────────────────────────────────────────────────────────
export async function inviteMemberAction(
  orgId: string,
  email: string,
  role: Role
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "invite_member");

  const { sub, usage } = await getOrgData(orgId);
  const plan = (sub?.plan ?? "free") as Plan;
  const currentCount = usage?.memberCount ?? 1;

  if (!canAddMember(plan, currentCount)) {
    return {
      success: false,
      error: `وصلت إلى الحد الأقصى لعدد الأعضاء. يرجى ترقية خطتك.`,
    };
  }

  // Check if already a member
  const existingMembership = await db
    .select({ id: memberships.id })
    .from(memberships)
    .innerJoin(
      sql`users u`,
      sql`memberships.user_id = u.id AND u.email = ${email}`
    )
    .where(eq(memberships.organizationId, orgId));

  if (existingMembership.length > 0) {
    return { success: false, error: "هذا المستخدم عضو بالفعل في المتجر" };
  }

  // Check for existing invite
  const [existing] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.email, email),
        eq(invitations.organizationId, orgId)
      )
    );

  if (existing) {
    await db.delete(invitations).where(eq(invitations.id, existing.id));
  }

  const token = generateId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(invitations).values({
    id: generateId(),
    email,
    organizationId: orgId,
    role,
    token,
    expiresAt,
    invitedById: user.id,
  });

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appUrl}/accept-invite?token=${token}`;
  await sendInviteEmail(email, org?.name ?? "متجرك", user.name ?? user.email, acceptUrl);

  revalidatePath(`/dashboard`);
  return { success: true, data: undefined };
}

// ─── Accept Invitation ─────────────────────────────────────────────────────────
export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  const user = await requireAuth();

  const [invite] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token));

  if (!invite) return { success: false, error: "الدعوة غير صالحة" };
  if (invite.expiresAt < new Date()) return { success: false, error: "انتهت صلاحية الدعوة" };
  if (invite.email !== user.email)
    return { success: false, error: "هذه الدعوة مخصصة لبريد إلكتروني آخر" };

  const existing = await getMembership(user.id, invite.organizationId);
  if (existing) return { success: false, error: "أنت عضو بالفعل في هذا المتجر" };

  await db.insert(memberships).values({
    id: generateId(),
    userId: user.id,
    organizationId: invite.organizationId,
    role: invite.role,
    updatedAt: new Date(),
  });

  // Update usage
  await db
    .update(usageRecords)
    .set({ memberCount: sql`member_count + 1` })
    .where(eq(usageRecords.organizationId, invite.organizationId));

  await db.delete(invitations).where(eq(invitations.id, invite.id));

  const [org] = await db.select().from(organizations).where(eq(organizations.id, invite.organizationId));
  await createNotification(
    invite.organizationId,
    "member",
    "عضو جديد انضم للفريق 👋",
    `${user.name ?? user.email} انضم إلى ${org?.name ?? "متجرك"}`,
    `/dashboard/${org?.slug ?? ""}/members`
  );

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Remove Member ─────────────────────────────────────────────────────────────
export async function removeMemberAction(
  orgId: string,
  targetUserId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const actorMembership = await getMembership(user.id, orgId);
  if (!actorMembership) return { success: false, error: "غير مصرح" };
  requirePermission(actorMembership.role as Role, "remove_member");

  const targetMembership = await getMembership(targetUserId, orgId);
  if (!targetMembership) return { success: false, error: "العضو غير موجود" };

  // Cannot remove an owner
  if (targetMembership.role === "OWNER") {
    return { success: false, error: "لا يمكن إزالة المالك من المتجر" };
  }

  await db
    .delete(memberships)
    .where(
      and(
        eq(memberships.userId, targetUserId),
        eq(memberships.organizationId, orgId)
      )
    );

  // Update usage
  await db
    .update(usageRecords)
    .set({ memberCount: sql`GREATEST(member_count - 1, 1)` })
    .where(eq(usageRecords.organizationId, orgId));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Change Member Role ────────────────────────────────────────────────────────
export async function changeMemberRoleAction(
  orgId: string,
  targetUserId: string,
  newRole: Role
): Promise<ActionResult> {
  const user = await requireAuth();
  const actorMembership = await getMembership(user.id, orgId);
  if (!actorMembership) return { success: false, error: "غير مصرح" };
  requirePermission(actorMembership.role as Role, "change_member_role");

  const targetMembership = await getMembership(targetUserId, orgId);
  if (!targetMembership) return { success: false, error: "العضو غير موجود" };

  // If downgrading from OWNER, ensure there's another owner
  if (targetMembership.role === "OWNER" && newRole !== "OWNER") {
    const [{ value: ownerCount }] = await db
      .select({ value: count() })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, orgId),
          eq(memberships.role, "OWNER")
        )
      );

    if (ownerCount <= 1) {
      return {
        success: false,
        error: "يجب أن يكون للمتجر مالك واحد على الأقل. انقل الملكية أولاً.",
      };
    }
  }

  await db
    .update(memberships)
    .set({ role: newRole, updatedAt: new Date() })
    .where(
      and(
        eq(memberships.userId, targetUserId),
        eq(memberships.organizationId, orgId)
      )
    );

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Update Organization Settings ─────────────────────────────────────────────
export async function updateOrganizationAction(
  orgId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "edit_settings");

  const name = (formData.get("name") as string)?.trim();
  const logoUrl = formData.get("logoUrl") as string;

  if (!name || name.length < 2) {
    return { success: false, error: "الاسم يجب أن يكون حرفين على الأقل" };
  }

  await db
    .update(organizations)
    .set({ name, logoUrl: logoUrl || null, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Delete Organization ───────────────────────────────────────────────────────
export async function deleteOrganizationAction(orgId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const membership = await getMembership(user.id, orgId);
  if (!membership) return { success: false, error: "غير مصرح" };
  requirePermission(membership.role as Role, "delete_organization");

  await db.delete(organizations).where(eq(organizations.id, orgId));
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

// ─── Get Dashboard Data ────────────────────────────────────────────────────────
export async function getDashboardData(orgSlug: string) {
  const user = await requireAuth();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug));

  if (!org) return null;

  const membership = await getMembership(user.id, org.id);
  if (!membership) return null;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, org.id));

  const [usage] = await db
    .select()
    .from(usageRecords)
    .where(eq(usageRecords.organizationId, org.id));

  const recentProducts = await db
    .select()
    .from(products)
    .where(eq(products.organizationId, org.id))
    .orderBy(desc(products.createdAt))
    .limit(6);

  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.organizationId, org.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const memberList = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      userId: memberships.userId,
      createdAt: memberships.createdAt,
    })
    .from(memberships)
    .where(eq(memberships.organizationId, org.id));

  return {
    org,
    membership,
    sub,
    usage,
    products: recentProducts,
    orders: recentOrders,
    members: memberList,
    currentUser: user,
  };
}
