import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrganizations } from "@/actions/organizations";
import { DashboardShell } from "@/components/layout/DashboardShell";

interface DashboardLayoutProps {
  children: ReactNode;
  params?: Promise<{ orgSlug?: string }>;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgsData = await getUserOrganizations();

  const organizations = orgsData.map((d) => ({
    id: d.org.id,
    name: d.org.name,
    slug: d.org.slug,
    logoUrl: d.org.logoUrl,
    plan: d.sub?.plan ?? "free",
  }));

  return (
    <DashboardShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
      }}
      organizations={organizations}
    >
      {children}
    </DashboardShell>
  );
}
