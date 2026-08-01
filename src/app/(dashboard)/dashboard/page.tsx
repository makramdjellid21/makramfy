import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrganizations } from "@/actions/organizations";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus, Building2, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgsData = await getUserOrganizations();

  if (orgsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-20 w-20 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
          <Building2 size={36} className="text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">مرحباً {user.name ?? ""}!</h1>
        <p className="text-slate-500 mb-8 max-w-sm">
          لم تنشئ أي منظمة بعد. أنشئ منظمتك الأولى للبدء.
        </p>
        <Link href="/dashboard/new">
          <Button size="lg">
            <Plus size={18} />
            إنشاء منظمة جديدة
          </Button>
        </Link>
      </div>
    );
  }

  // Redirect to first org
  redirect(`/dashboard/${orgsData[0].org.slug}`);
}
