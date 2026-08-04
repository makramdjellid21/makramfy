import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (!user.isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <ShieldCheck size={40} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">وصول مرفوض</h1>
          <p className="text-slate-400 text-sm mb-6">
            حسابك ({user.email}) ما عنده صلاحية أدمن المنصة.
          </p>
          <form action={logoutAction}>
            <button className="text-sm text-slate-300 underline">تسجيل خروج</button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
