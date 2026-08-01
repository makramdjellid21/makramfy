"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ImageUploader } from "@/components/ImageUploader";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  toggleProductFeaturedAction,
  updateStockAction,
} from "@/actions/products";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { Plus, Package, Trash2, MoreVertical, Pencil, Tag, Star } from "lucide-react";

interface Variant {
  id: string;
  stockQuantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
}

interface ProductsClientProps {
  orgId: string;
  orgSlug: string;
  products: Product[];
  categories: Category[];
  myRole: string;
  plan: string;
  productLimit: number | typeof Infinity;
  productCount: number;
}

function formatDzd(cents: number) {
  return `${(cents / 100).toLocaleString("ar-DZ")} د.ج`;
}

export function ProductsClient({
  orgId,
  orgSlug,
  products,
  categories,
  myRole,
  plan,
  productLimit,
  productCount,
}: ProductsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const canManage = hasPermission(myRole as Role, "manage_products");
  const canDelete = hasPermission(myRole as Role, "delete_product");
  const atLimit = productLimit !== Infinity && productCount >= productLimit;

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setCategoryId("");
    setPrice("");
    setStockQuantity("0");
    setError("");
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setName(product.name);
    setDescription(product.description ?? "");
    setImageUrl(product.imageUrl ?? "");
    setCategoryId(product.categoryId ?? "");
    setPrice(String(product.basePriceCents / 100));
    setStockQuantity(String(product.variants[0]?.stockQuantity ?? 0));
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!name.trim() || !price) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    formData.set("imageUrl", imageUrl);
    formData.set("categoryId", categoryId);
    formData.set("price", price);
    formData.set("stockQuantity", stockQuantity);

    const result = editing
      ? await updateProductAction(orgId, editing.id, formData)
      : await createProductAction(orgId, formData);

    if (editing && result.success && stockQuantity !== String(editing.variants[0]?.stockQuantity ?? 0)) {
      await updateStockAction(orgId, editing.id, Number(stockQuantity));
    }

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setModalOpen(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    setBusyId(productId);
    const result = await deleteProductAction(orgId, productId);
    setBusyId(null);
    setOpenMenuId(null);
    if (!result.success) setError(result.error);
  }

  async function handleToggleActive(product: Product) {
    setBusyId(product.id);
    await toggleProductActiveAction(orgId, product.id, !product.isActive);
    setBusyId(null);
    setOpenMenuId(null);
  }

  async function handleToggleFeatured(product: Product) {
    setBusyId(product.id);
    await toggleProductFeaturedAction(orgId, product.id, !product.isFeatured);
    setBusyId(null);
    setOpenMenuId(null);
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المنتجات</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {productCount} من {productLimit === Infinity ? "∞" : productLimit} منتجات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/${orgSlug}/categories`}>
            <Button variant="outline" size="sm">
              <Tag size={14} />
              التصنيفات
            </Button>
          </Link>
          {canManage && (
            <Button onClick={openCreate} disabled={atLimit} title={atLimit ? "وصلت للحد الأقصى" : ""}>
              <Plus size={16} />
              منتج جديد
            </Button>
          )}
        </div>
      </div>

      {atLimit && canManage && (
        <Alert type="warning">
          وصلت إلى الحد الأقصى للمنتجات في خطة {plan}.{" "}
          <a href={`/dashboard/${orgSlug}/billing`} className="font-medium underline">
            ترقية الخطة
          </a>
        </Alert>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <Package size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">لا توجد منتجات بعد</h3>
          <p className="text-slate-500 text-sm mb-6">أضف أول منتج بمتجرك للبدء بالبيع</p>
          {canManage && (
            <Button onClick={openCreate} disabled={atLimit}>
              <Plus size={16} />
              منتج جديد
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => {
            const stock = product.variants[0]?.stockQuantity ?? 0;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="relative">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <Package size={36} className="text-emerald-300" />
                    </div>
                  )}
                  {!product.isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default">معطّل</Badge>
                    </div>
                  )}
                  {product.isFeatured && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="warning">
                        <span className="flex items-center gap-1">
                          <Star size={10} fill="currentColor" />
                          مميز
                        </span>
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                      {product.category && (
                        <span className="text-xs text-slate-400">{product.category.name}</span>
                      )}
                    </div>
                    {canManage && (
                      <div className="relative shrink-0">
                        <button
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                          disabled={busyId === product.id}
                        >
                          {busyId === product.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                          ) : (
                            <MoreVertical size={16} />
                          )}
                        </button>
                        {openMenuId === product.id && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-10 min-w-40 py-1">
                            <button
                              className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              onClick={() => {
                                openEdit(product);
                                setOpenMenuId(null);
                              }}
                            >
                              <Pencil size={14} />
                              تعديل
                            </button>
                            <button
                              className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => handleToggleActive(product)}
                            >
                              {product.isActive ? "تعطيل المنتج" : "تفعيل المنتج"}
                            </button>
                            <button
                              className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => handleToggleFeatured(product)}
                            >
                              {product.isFeatured ? "إلغاء التمييز" : "تمييز المنتج"}
                            </button>
                            {canDelete && (
                              <button
                                className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 size={14} />
                                حذف
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-emerald-700 font-bold text-sm">
                      {formatDzd(product.basePriceCents)}
                    </span>
                    <span className={`text-xs ${stock === 0 ? "text-red-500" : "text-slate-400"}`}>
                      {stock === 0 ? "نفد المخزون" : `المخزون: ${stock}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setError("");
        }}
        title={editing ? "تعديل المنتج" : "إضافة منتج جديد"}
        size="md"
      >
        <div className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <Input label="اسم المنتج" placeholder="مثال: قميص قطني" value={name} onChange={(e) => setName(e.target.value)} />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">الوصف (اختياري)</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="وصف المنتج..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">التصنيف (اختياري)</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">بدون تصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="السعر (د.ج)"
              type="number"
              min="0"
              placeholder="1500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="الكمية بالمخزون"
              type="number"
              min="0"
              placeholder="10"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
          </div>

          <ImageUploader value={imageUrl} onChange={setImageUrl} folder="makramfy/products" label="صورة المنتج" />

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              {editing ? "حفظ التعديلات" : "إضافة المنتج"}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
