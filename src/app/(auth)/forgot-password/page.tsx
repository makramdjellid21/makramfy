"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { requestPasswordResetAction } from "@/actions/auth";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await requestPasswordResetAction(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        {sent ? (
          <div className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <MailCheck size={26} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">تحقق من بريدك</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              إذا كان هذا الإيميل مرتبطًا بحساب، أرسلنا له رابط إعادة تعيين كلمة المرور. الرابط صالح لمدة ساعة.
            </p>
            <Link href="/login" className="inline-block mt-6 text-sm font-medium text-violet-600 hover:text-violet-700">
              رجوع لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">نسيت كلمة المرور؟</h1>
              <p className="text-slate-500 text-sm mt-1">أدخل إيميلك وسنرسل لك رابط إعادة التعيين</p>
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
              <Button type="submit" className="w-full" loading={loading}>
                إرسال رابط إعادة التعيين
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              تذكّرت كلمة المرور؟{" "}
              <Link href="/login" className="text-violet-600 font-medium hover:text-violet-700">
                تسجيل الدخول
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
