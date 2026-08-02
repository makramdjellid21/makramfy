"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createCategoryAction, deleteCategoryAction } from "@/actions/categories";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { Plus, Tag, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesClientProps {
  orgId: string;
  categories: Category[];
  myRole: string;
}

export function CategoriesClient({ orgId, categories, myRole }: CategoriesClientProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = hasPermission(myRole as Role, "manage_categories");

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("name", name.trim());
    const result = await createCategoryAction(orgId, formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setName("");
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm("حذف التصنيف؟ المنتجات المرتبطة به تبقى بدون تصنيف.")) return;
    setBusyId(categoryId);
    const result = await deleteCategoryAction(orgId, categoryId);
    setBusyId(null);
    if (!result.success) setError(result.error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">التصنيفات</h1>
        <p className="text-sm text-slate-500 mt-0.5">نظّم منتجات متجرك بتصنيفات</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {canManage && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="اسم التصنيف"
              placeholder="مثال: ملابس رجالية"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button onClick={handleCreate} loading={loading}>
            <Plus size={16} />
            إضافة
          </Button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Tag size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">لا توجد تصنيفات بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Tag size={16} className="text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-800">{cat.name}</span>
              </div>
              {canManage && (
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={busyId === cat.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
