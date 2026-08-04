"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptInvitationAction } from "@/actions/organizations";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("رابط الدعوة غير صالح");
      return;
    }

    acceptInvitationAction(token)
      .then((result) => {
        if (result.success) {
          setStatus("success");
          setTimeout(() => router.push("/dashboard"), 1800);
        } else {
          setStatus("error");
          setError(result.error);
        }
      })
      .catch(() => {
        // المستخدم غير مسجّل دخوله — نوجّهه لتسجيل الدخول ثم يعيد فتح نفس رابط الدعوة
        router.push(`/login?redirect=/accept-invite?token=${token}`);
      });
  }, [token, router]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin text-violet-600 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-slate-900">جارٍ التحقق من الدعوة...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">تم قبول الدعوة!</h1>
            <p className="text-slate-500 text-sm">جارٍ تحويلك للوحة التحكم...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle size={26} className="text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">تعذّر قبول الدعوة</h1>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                الذهاب للوحة التحكم
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md text-center text-sm text-slate-400">جارٍ التحميل...</div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
