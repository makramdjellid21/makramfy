import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { getOrders } from "@/actions/orders";
import { getBlockedPhonesForOrg } from "@/actions/security";
import { OrdersClient } from "./OrdersClient";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrdersPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(orgSlug);
  if (!data) notFound();

  const { org, membership } = data;
  const [orderList, blockedPhonesList] = await Promise.all([
    getOrders(org.id),
    getBlockedPhonesForOrg(org.id),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <OrdersClient
        orgId={org.id}
        orders={orderList}
        blockedPhones={blockedPhonesList}
        myRole={membership.role}
      />
    </div>
  );
}
