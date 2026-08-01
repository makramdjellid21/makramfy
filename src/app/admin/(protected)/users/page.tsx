import { getAllUsers } from "@/actions/admin";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck } from "lucide-react";

export default async function AdminUsersPage() {
  const usersList = await getAllUsers();
  if (!usersList) return null;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">المستخدمون</h1>
        <p className="text-sm text-slate-400 mt-1">كل الحسابات المسجّلة بالمنصة ({usersList.length})</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
        {usersList.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                {(u.name ?? u.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.name ?? "بدون اسم"}</p>
                <p className="text-xs text-slate-500 truncate" dir="ltr">
                  {u.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {u.isPlatformAdmin && (
                <Badge variant="warning">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={11} />
                    أدمن
                  </span>
                </Badge>
              )}
              <span className="text-xs text-slate-500">
                {new Date(u.createdAt).toLocaleDateString("ar-DZ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
