"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { loginAction } from "@/actions/auth";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
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
        setLoading(false);
        return;
      }

      // نتحقق إن المستخدم فعليًا أدمن قبل ما ندخله (وإلا loginAction وحده يسمح لأي مستخدم)
      router.push("/");
      router.refresh();
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">لوحة إدارة المنصة</h1>
          <p className="text-slate-400 text-sm mt-1">MakramFy — دخول مقيّد لأدمن المنصة فقط</p>
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
            placeholder="admin@makramfy.com"
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
            دخول
          </Button>
        </form>
      </div>
    </div>
  );
}
