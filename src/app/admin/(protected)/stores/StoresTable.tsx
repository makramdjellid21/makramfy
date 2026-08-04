"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminSetStorePlanAction, adminSetStoreCloudinaryAction } from "@/actions/admin";
import { ExternalLink, Cloud, X } from "lucide-react";

interface Store {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  subscription: { plan: string; status: string } | null;
  storeSettings: {
    isPublished: boolean;
    cloudinaryCloudName: string | null;
    cloudinaryApiKey: string | null;
    cloudinaryApiSecret: string | null;
  } | null;
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
  const [cloudinaryStoreId, setCloudinaryStoreId] = useState<string | null>(null);

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

  const activeStore = localStores.find((s) => s.id === cloudinaryStoreId) ?? null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
      {localStores.map((store) => {
        const hasCustomCloudinary = Boolean(store.storeSettings?.cloudinaryCloudName);
        return (
          <div key={store.id} className="flex items-center justify-between gap-4 p-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{store.name}</p>
                {store.storeSettings?.isPublished ? (
                  <Badge variant="success">منشور</Badge>
                ) : (
                  <Badge variant="default">غير منشور</Badge>
                )}
                {hasCustomCloudinary && <Badge variant="info">Cloudinary خاص</Badge>}
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
              <button
                onClick={() => setCloudinaryStoreId(store.id)}
                title="بيانات Cloudinary مخصصة"
                className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${
                  hasCustomCloudinary
                    ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Cloud size={15} />
              </button>
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
        );
      })}

      {localStores.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-12">ما فيه متاجر بعد</p>
      )}

      {activeStore && (
        <CloudinaryPanel
          store={activeStore}
          onClose={() => setCloudinaryStoreId(null)}
          onSaved={(cloudName, apiKey, apiSecret) => {
            setLocalStores((prev) =>
              prev.map((s) =>
                s.id === activeStore.id
                  ? {
                      ...s,
                      storeSettings: {
                        isPublished: s.storeSettings?.isPublished ?? false,
                        cloudinaryCloudName: cloudName || null,
                        cloudinaryApiKey: apiKey || null,
                        cloudinaryApiSecret: apiSecret || null,
                      },
                    }
                  : s
              )
            );
            setCloudinaryStoreId(null);
          }}
        />
      )}
    </div>
  );
}

function CloudinaryPanel({
  store,
  onClose,
  onSaved,
}: {
  store: Store;
  onClose: () => void;
  onSaved: (cloudName: string, apiKey: string, apiSecret: string) => void;
}) {
  const [cloudName, setCloudName] = useState(store.storeSettings?.cloudinaryCloudName ?? "");
  const [apiKey, setApiKey] = useState(store.storeSettings?.cloudinaryApiKey ?? "");
  const [apiSecret, setApiSecret] = useState(store.storeSettings?.cloudinaryApiSecret ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    const result = await adminSetStoreCloudinaryAction(store.id, { cloudName, apiKey, apiSecret });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSaved(cloudName, apiKey, apiSecret);
  }

  function handleClear() {
    setCloudName("");
    setApiKey("");
    setApiSecret("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Cloud size={16} className="text-sky-400" />
            Cloudinary — {store.name}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          خلّي الحقول فارغة ليستخدم هذا المتجر حساب Cloudinary المشترك تلقائيًا.
        </p>

        {error && <p className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Cloud Name</label>
            <input
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              dir="ltr"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              placeholder="my-cloud-name"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">API Key</label>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              dir="ltr"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              placeholder="123456789012345"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">API Secret</label>
            <input
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              dir="ltr"
              type="password"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              placeholder="••••••••••••••••"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button onClick={handleSave} loading={saving} className="flex-1">
            حفظ
          </Button>
          <Button variant="outline" onClick={handleClear} type="button">
            مسح
          </Button>
        </div>
      </div>
    </div>
  );
}
