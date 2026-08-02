import { db } from "@/db";
import { memberships } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getMembershipRole(
  userId: string,
  orgId: string
): Promise<string | null> {
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId))
    );
  return membership?.role ?? null;
}
