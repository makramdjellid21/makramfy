"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { blockPhonePlatformAction, unblockPhonePlatformAction } from "@/actions/security";
import { ShieldBan, ShieldAlert, Sparkles } from "lucide-react";

interface BlockedPhone {
  id: string;
  phone: string;
  reason: string | null;
  createdAt: Date;
}

interface Suggestion {
  phone: string;
  storeCount: number;
}

export function FraudClient({
  blocked,
  suggestions,
}: {
  blocked: BlockedPhone[];
  suggestions: Suggestion[];
}) {
  const [error, setError] = useState("");
  const [localBlocked, setLocalBlocked] = useState(blocked);
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);
  const [busyPhone, setBusyPhone] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [newReason, setNewReason] = useState("");

  async function handleBlock(phone: string, reason?: string) {
    setBusyPhone(phone);
    const result = await blockPhonePlatformAction(phone, reason);
    setBusyPhone(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLocalBlocked((prev) => [
      { id: `tmp-${phone}`, phone, reason: reason ?? null, createdAt: new Date() },
      ...prev,
    ]);
    setLocalSuggestions((prev) => prev.filter((s) => s.phone !== phone));
  }

  async function handleUnblock(id: string, phone: string) {
    setBusyPhone(phone);
    const result = await unblockPhonePlatformAction(id);
    setBusyPhone(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLocalBlocked((prev) => prev.filter((b) => b.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPhone.trim()) return;
    handleBlock(newPhone.trim(), newReason.trim() || undefined);
    setNewPhone("");
    setNewReason("");
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">الحماية من الاحتيال</h1>
        <p className="text-sm text-slate-400 mt-1">
          قائمة سوداء تعاونية للأرقام المحتالة عبر كل متاجر المنصة
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* اقتراحات ذكية */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">اقتراحات ذكية للحظر الشامل</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          أرقام حظرها تاجران مستقلّان أو أكثر — إشارة قوية على احتيال حقيقي
        </p>

        {localSuggestions.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد اقتراحات حاليًا</p>
        ) : (
          <div className="space-y-1.5">
            {localSuggestions.map((s) => (
              <div
                key={s.phone}
                className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span dir="ltr" className="text-sm font-medium text-white">
                    {s.phone}
                  </span>
                  <Badge variant="warning">حظرته {s.storeCount} متاجر</Badge>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  loading={busyPhone === s.phone}
                  onClick={() => handleBlock(s.phone, "اقتراح تلقائي: حظرته عدة متاجر مستقلة")}
                >
                  حظر شامل
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* الحظر اليدوي + القائمة الحالية */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldBan size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-white">
            الأرقام المحظورة على مستوى المنصة ({localBlocked.length})
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4">
          <input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="رقم الهاتف (مثال: 0555xxxxxx)"
            dir="ltr"
            className="flex-1 min-w-[160px] text-sm px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="السبب (اختياري)"
            className="flex-1 min-w-[160px] text-sm px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Button type="submit" size="sm" variant="danger" loading={busyPhone === newPhone}>
            <ShieldAlert size={14} />
            حظر شامل
          </Button>
        </form>

        {localBlocked.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد أرقام محظورة على مستوى المنصة حاليًا</p>
        ) : (
          <div className="space-y-1.5">
            {localBlocked.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2"
              >
                <div>
                  <span dir="ltr" className="text-sm font-medium text-white">
                    {b.phone}
                  </span>
                  {b.reason && <span className="text-xs text-slate-500 mr-2"> — {b.reason}</span>}
                </div>
                <button
                  onClick={() => handleUnblock(b.id, b.phone)}
                  disabled={busyPhone === b.phone}
                  className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                >
                  إلغاء الحظر
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
