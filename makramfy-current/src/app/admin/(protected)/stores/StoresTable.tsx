"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { adminSetStorePlanAction } from "@/actions/admin";
import { ExternalLink } from "lucide-react";

interface Store {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  subscription: { plan: string; status: string } | null;
  storeSettings: { isPublished: boolean } | null;
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const PLAN_VARIANT: Record<string, "default" | "info" | "purple"> = {
  free: "default",
  pro: "info",
  business: "purple",
};

const PLAN_LABELS: Record<string, string> = { free: "مجاني", pro: "احترافي", business: "أعمال" };

export function StoresTable({ stores }: { stores: Store[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localStores, setLocalStores] = useState(stores);

  async function handlePlanChange(orgId: string, plan: string) {
    setBusyId(orgId);
    const result = await adminSetStorePlanAction(orgId, plan as "free" | "pro" | "business");
    setBusyId(null);
    if (result.success) {
      setLocalStores((prev) =>
        prev.map((s) => (s.id === orgId ? { ...s, subscription: { plan, status: plan === "free" ? "free" : "active" } } : s))
      );
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
      {localStores.map((store) => (
        <div key={store.id} className="flex items-center justify-between gap-4 p-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">{store.name}</p>
              {store.storeSettings?.isPublished ? (
                <Badge variant="success">منشور</Badge>
              ) : (
                <Badge variant="default">غير منشور</Badge>
              )}
            </div>
            <a
              href={`http://${store.slug}.${ROOT_DOMAIN}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-amber-500 flex items-center gap-1 mt-1"
              dir="ltr"
            >
              {store.slug}.{ROOT_DOMAIN}
              <ExternalLink size={11} />
            </a>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge variant={PLAN_VARIANT[store.subscription?.plan ?? "free"]}>
              {PLAN_LABELS[store.subscription?.plan ?? "free"]}
            </Badge>
            <select
              value={store.subscription?.plan ?? "free"}
              disabled={busyId === store.id}
              onChange={(e) => handlePlanChange(store.id, e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="free">مجاني</option>
              <option value="pro">احترافي</option>
              <option value="business">أعمال</option>
            </select>
          </div>
        </div>
      ))}

      {localStores.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-12">ما فيه متاجر بعد</p>
      )}
    </div>
  );
}
