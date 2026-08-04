"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  adminBlockPhonePlatformWideAction,
  adminUnblockPhonePlatformWideAction,
} from "@/actions/admin";
import { Ban, ShieldAlert, X } from "lucide-react";

interface BlockedPhone {
  id: string;
  phone: string;
  reason: string | null;
  createdAt: Date;
}

interface SuggestedPhone {
  phone: string;
  storeCount: number;
}

export function BlockedPhonesClient({
  initialBlocked,
  initialSuggested,
}: {
  initialBlocked: BlockedPhone[];
  initialSuggested: SuggestedPhone[];
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [suggested, setSuggested] = useState(initialSuggested);
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyPhone, setBusyPhone] = useState<string | null>(null);

  async function handleAdd(phone: string, reason?: string) {
    const clean = phone.trim();
    if (!clean) return;
    setAdding(true);
    const result = await adminBlockPhonePlatformWideAction(clean, reason);
    setAdding(false);
    if (result.success) {
      setBlocked((prev) => [{ id: `temp-${Date.now()}`, phone: clean, reason: reason ?? null, createdAt: new Date() }, ...prev]);
      setSuggested((prev) => prev.filter((s) => s.phone !== clean));
      setNewPhone("");
    }
  }

  async function handleUnblock(id: string) {
    setBusyPhone(id);
    const result = await adminUnblockPhonePlatformWideAction(id);
    setBusyPhone(null);
    if (result.success) setBlocked((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      {suggested.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
            <ShieldAlert size={15} />
            أرقام حظرتها أكثر من متجر — مرشّحة للحظر الشامل
          </h2>
          <div className="space-y-2">
            {suggested.map((s) => (
              <div key={s.phone} className="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm text-white" dir="ltr">{s.phone}</p>
                  <p className="text-xs text-slate-400">حظره {s.storeCount} متاجر مستقلة</p>
                </div>
                <Button
                  size="sm"
                  loading={adding}
                  onClick={() => handleAdd(s.phone, `حظرته ${s.storeCount} متاجر مستقلة`)}
                  className="!bg-amber-500 hover:!bg-amber-600"
                >
                  حظر شامل
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Ban size={15} className="text-red-500" />
          إضافة رقم للحظر الشامل يدويًا
        </h2>
        <div className="flex gap-2">
          <input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="0555xxxxxx"
            dir="ltr"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500"
          />
          <Button loading={adding} onClick={() => handleAdd(newPhone)} className="!bg-red-600 hover:!bg-red-700">
            حظر
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
        <div className="px-5 py-3.5">
          <h2 className="text-sm font-bold text-white">الأرقام المحظورة حاليًا ({blocked.length})</h2>
        </div>
        {blocked.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-10">ما فيه أرقام محظورة على مستوى المنصة حاليًا</p>
        ) : (
          blocked.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-slate-200" dir="ltr">{p.phone}</p>
                {p.reason && <p className="text-xs text-slate-500">{p.reason}</p>}
              </div>
              <button
                onClick={() => handleUnblock(p.id)}
                disabled={busyPhone === p.id}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-slate-800"
              >
                <X size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
