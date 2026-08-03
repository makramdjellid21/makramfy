"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { resetPasswordAction } from "@/actions/auth";
import { CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      formData.set("token", token);
      const result = await resetPasswordAction(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">رابط غير صالح</h1>
        <p className="text-slate-500 text-sm mb-6">تأكد من فتح نفس الرابط المُرسل لإيميلك، أو اطلب رابطًا جديدًا.</p>
        <Link href="/forgot-password" className="text-violet-600 font-medium text-sm hover:text-violet-700">
          طلب رابط جديد
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={26} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">تم تغيير كلمة المرور</h1>
        <p className="text-slate-500 text-sm">جارٍ تحويلك لتسجيل الدخول...</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">كلمة مرور جديدة</h1>
        <p className="text-slate-500 text-sm mt-1">اختر كلمة مرور جديدة لحسابك</p>
      </div>

      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="كلمة المرور الجديدة"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
        />
        <Input
          label="تأكيد كلمة المرور"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
        />
        <Button type="submit" className="w-full" loading={loading}>
          تغيير كلمة المرور
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <Suspense fallback={<div className="text-center text-sm text-slate-400">جارٍ التحميل...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
