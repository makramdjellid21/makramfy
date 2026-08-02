import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { db } from "@/db";
import { users, memberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MembersClient } from "./MembersClient";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/lib/plans";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function MembersPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(orgSlug);
  if (!data) notFound();

  const { org, membership, sub, usage, members: memberList } = data;

  // Get detailed user info for each member
  const membersWithUsers = await Promise.all(
    memberList.map(async (m) => {
      const [u] = await db.select().from(users).where(eq(users.id, m.userId));
      return {
        id: m.id,
        userId: m.userId,
        role: m.role,
        email: u?.email ?? "",
        name: u?.name ?? null,
        imageUrl: u?.imageUrl ?? null,
        createdAt: m.createdAt,
      };
    })
  );

  const plan = (sub?.plan ?? "free") as Plan;
  const limits = PLAN_LIMITS[plan];
  const memberCount = usage?.memberCount ?? memberList.length;

  return (
    <div className="max-w-3xl mx-auto">
      <MembersClient
        orgId={org.id}
        orgSlug={orgSlug}
        members={membersWithUsers}
        currentUserId={user.id}
        myRole={membership.role}
        plan={plan}
        memberLimit={limits.maxMembers}
        memberCount={memberCount}
      />
    </div>
  );
}
