import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrganizations } from "@/actions/organizations";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

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
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-l border-slate-100 overflow-y-auto">
        <DashboardSidebar
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
          }}
          organizations={organizations}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="min-h-full p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
