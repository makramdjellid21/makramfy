"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { loginAction } from "@/actions/auth";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_failed: "تعذّر تسجيل الدخول عبر جوجل، حاول مرة أخرى",
  google_not_configured: "تسجيل الدخول عبر جوجل غير مفعّل حاليًا",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleError = searchParams.get("error");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await loginAction(formData);

      if (!result.success) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const displayedError = error || (googleError ? GOOGLE_ERROR_MESSAGES[googleError] ?? "حدث خطأ، حاول مرة أخرى" : "");

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">م</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">مرحباً بعودتك</h1>
          <p className="text-slate-500 text-sm mt-1">سجّل دخولك لمتابعة العمل</p>
        </div>

        {displayedError && (
          <Alert type="error" className="mb-6">
            {displayedError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            dir="ltr"
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            dir="ltr"
          />

          <div className="text-left -mt-2">
            <Link href="/forgot-password" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            تسجيل الدخول
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400">أو</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <GoogleIcon />
          المتابعة عبر جوجل
        </a>

        <p className="text-center text-sm text-slate-500 mt-6">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="text-violet-600 font-medium hover:text-violet-700">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center text-sm text-slate-400">جارٍ التحميل...</div>}>
      <LoginForm />
    </Suspense>
  );
}
