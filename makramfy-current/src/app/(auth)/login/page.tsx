"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
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

        {error && (
          <Alert type="error" className="mb-6">
            {error}
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

          <Button type="submit" className="w-full" loading={loading}>
            تسجيل الدخول
          </Button>
        </form>

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
