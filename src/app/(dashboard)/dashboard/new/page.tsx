"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createOrganizationAction } from "@/actions/organizations";
import { Building2 } from "lucide-react";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await createOrganizationAction(formData);

      if (!result.success) {
        setError(result.error);
      } else {
        router.push(`/dashboard/${result.data.slug}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
          <Building2 size={28} className="text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">إنشاء منظمة جديدة</h1>
        <p className="text-slate-500 text-sm mt-2">
          ستكون أول مالك للمنظمة وتستطيع دعوة أعضاء لاحقاً.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="اسم المنظمة"
            name="name"
            type="text"
            placeholder="شركتي / فريقي"
            required
            hint="سيتم إنشاء رابط فريد تلقائياً بناءً على الاسم"
          />

          <Button type="submit" className="w-full" loading={loading} size="lg">
            إنشاء المنظمة
          </Button>
        </form>
      </div>
    </div>
  );
}
