"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { registerAction } from "@/actions/auth";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get("password") as string;
      const confirm = formData.get("confirmPassword") as string;

      if (password !== confirm) {
        setError("كلمتا المرور غير متطابقتين");
        return;
      }

      const result = await registerAction(formData);

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
          <h1 className="text-2xl font-bold text-slate-900">إنشاء حساب جديد</h1>
          <p className="text-slate-500 text-sm mt-1">انضم إلى MakramFy مجاناً وأطلق متجرك الإلكتروني</p>
        </div>

        <div className="flex items-center gap-4 bg-violet-50 rounded-xl p-3 mb-6 text-xs text-violet-700">
          {["مجاني للأبد", "لا بطاقة ائتمانية", "إلغاء فوري"].map((item) => (
            <div key={item} className="flex items-center gap-1">
              <Check size={12} className="text-violet-500" />
              {item}
            </div>
          ))}
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="الاسم الكامل"
            name="name"
            type="text"
            placeholder="اسمك"
            required
            autoComplete="name"
          />
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
            placeholder="٨ أحرف على الأقل"
            required
            minLength={8}
            autoComplete="new-password"
            dir="ltr"
          />
          <Input
            label="تأكيد كلمة المرور"
            name="confirmPassword"
            type="password"
            placeholder="أعد كتابة كلمة المرور"
            required
            autoComplete="new-password"
            dir="ltr"
          />

          <Button type="submit" className="w-full" loading={loading} size="lg">
            إنشاء الحساب
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
          التسجيل عبر جوجل
        </a>

        <p className="text-center text-sm text-slate-500 mt-6">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-violet-600 font-medium hover:text-violet-700">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
