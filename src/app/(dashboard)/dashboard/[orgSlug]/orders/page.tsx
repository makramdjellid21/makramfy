import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { getOrders } from "@/actions/orders";
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
  const orderList = await getOrders(org.id);

  return (
    <div className="max-w-6xl mx-auto">
      <OrdersClient orgId={org.id} orders={orderList} myRole={membership.role} />
    </div>
  );
}
