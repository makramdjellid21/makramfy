import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { getProducts } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { ProductsClient } from "./ProductsClient";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/lib/plans";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ProductsPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(orgSlug);
  if (!data) notFound();

  const { org, membership, sub, usage } = data;
  const plan = (sub?.plan ?? "free") as Plan;
  const limits = PLAN_LIMITS[plan];

  const [productList, categoryList] = await Promise.all([
    getProducts(org.id),
    getCategories(org.id),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <ProductsClient
        orgId={org.id}
        orgSlug={orgSlug}
        products={productList}
        categories={categoryList}
        myRole={membership.role}
        plan={plan}
        productLimit={limits.maxProducts}
        productCount={usage?.productCount ?? productList.length}
      />
    </div>
  );
}
