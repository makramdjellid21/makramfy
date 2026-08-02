import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/actions/organizations";
import { getCategories } from "@/actions/categories";
import { CategoriesClient } from "./CategoriesClient";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CategoriesPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(orgSlug);
  if (!data) notFound();

  const { org, membership } = data;
  const categoryList = await getCategories(org.id);

  return (
    <div className="max-w-3xl mx-auto">
      <CategoriesClient orgId={org.id} categories={categoryList} myRole={membership.role} />
    </div>
  );
}
