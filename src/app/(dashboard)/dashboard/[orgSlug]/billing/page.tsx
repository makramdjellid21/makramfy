import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { BillingClient } from "./BillingClient";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function BillingPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(orgSlug);
  if (!data) notFound();

  const { org, sub } = data;

  return (
    <div className="max-w-4xl mx-auto">
      <Suspense fallback={null}>
        <BillingClient
          orgId={org.id}
          plan={sub?.plan ?? "free"}
          status={sub?.status ?? "free"}
          currentPeriodEnd={sub?.currentPeriodEnd ?? null}
          cancelAtPeriodEnd={sub?.cancelAtPeriodEnd ?? false}
        />
      </Suspense>
    </div>
  );
}
