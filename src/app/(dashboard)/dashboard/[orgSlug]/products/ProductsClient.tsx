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
  addProductVariantAction,
  updateProductVariantAction,
  deleteProductVariantAction,
} from "@/actions/products";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { Plus, Package, Trash2, MoreVertical, Pencil, Tag, Star, X, Layers } from "lucide-react";

interface Variant {
  id: string;
  name: string;
  priceCents: number | null;
  stockQuantity: number;
  imageUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  images: string[];
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
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [variantsProduct, setVariantsProduct] = useState<Product | null>(null);

  const canManage = hasPermission(myRole as Role, "manage_products");
  const canDelete = hasPermission(myRole as Role, "delete_product");
  const atLimit = productLimit !== Infinity && productCount >= productLimit;

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setImages([]);
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
    setImages(product.images ?? []);
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
    formData.set("images", JSON.stringify(images));
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
                              className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              onClick={() => {
                                setVariantsProduct(product);
                                setOpenMenuId(null);
                              }}
                            >
                              <Layers size={14} />
                              الألوان / المقاسات
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

          <ImageUploader value={imageUrl} onChange={setImageUrl} folder="makramfy/products" label="الصورة الرئيسية" />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">صور إضافية (اختياري)</label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200"
                  >
                    <X size={12} className="text-slate-600" />
                  </button>
                </div>
              ))}
              <div className="w-20">
                <ImageUploader
                  value=""
                  onChange={(url) => url && setImages([...images, url])}
                  folder="makramfy/products"
                  label=""
                  className="[&>div]:w-20 [&>div]:h-20 [&>div]:p-0 [&>div]:flex [&>div]:items-center [&>div]:justify-center"
                />
              </div>
            </div>
          </div>

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

      {variantsProduct && (
        <VariantsModal
          orgId={orgId}
          product={variantsProduct}
          onClose={() => setVariantsProduct(null)}
        />
      )}
    </div>
  );
}

function VariantsModal({
  orgId,
  product,
  onClose,
}: {
  orgId: string;
  product: Product;
  onClose: () => void;
}) {
  const [variants, setVariants] = useState<Variant[]>(product.variants);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // نموذج إضافة متغيّر جديد
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newImage, setNewImage] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) {
      setError("اكتب اسم المتغيّر (مثال: أحمر - L)");
      return;
    }
    setAdding(true);
    setError("");
    const result = await addProductVariantAction(orgId, product.id, {
      name: newName.trim(),
      priceCents: newPrice ? Math.round(Number(newPrice) * 100) : null,
      stockQuantity: Number(newStock) || 0,
      imageUrl: newImage || null,
    });
    setAdding(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setVariants([
      ...variants,
      {
        id: result.data.variantId,
        name: newName.trim(),
        priceCents: newPrice ? Math.round(Number(newPrice) * 100) : null,
        stockQuantity: Number(newStock) || 0,
        imageUrl: newImage || null,
      },
    ]);
    setNewName("");
    setNewPrice("");
    setNewStock("0");
    setNewImage("");
  }

  async function handleUpdate(v: Variant) {
    setBusy(v.id);
    setError("");
    const result = await updateProductVariantAction(orgId, v.id, {
      name: v.name,
      priceCents: v.priceCents,
      stockQuantity: v.stockQuantity,
      imageUrl: v.imageUrl,
    });
    setBusy(null);
    if (!result.success) setError(result.error);
  }

  async function handleDelete(variantId: string) {
    if (!confirm("حذف هذا المتغيّر؟")) return;
    setBusy(variantId);
    setError("");
    const result = await deleteProductVariantAction(orgId, product.id, variantId);
    setBusy(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setVariants(variants.filter((v) => v.id !== variantId));
  }

  function updateLocal(id: string, patch: Partial<Variant>) {
    setVariants(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  return (
    <Modal isOpen onClose={onClose} title={`الألوان / المقاسات — ${product.name}`} size="md">
      <div className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        <p className="text-xs text-slate-500">
          كل متغيّر يظهر للعميل كخيار منفصل (مثال: أحمر - L). اترك السعر فارغًا لاستخدام سعر المنتج الأساسي.
        </p>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {variants.map((v) => (
            <div key={v.id} className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
                  value={v.name}
                  onChange={(e) => updateLocal(v.id, { name: e.target.value })}
                  placeholder="أحمر - L"
                />
                <button
                  onClick={() => handleDelete(v.id)}
                  disabled={busy === v.id}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
                  type="number"
                  min="0"
                  placeholder="السعر (اختياري)"
                  value={v.priceCents !== null ? v.priceCents / 100 : ""}
                  onChange={(e) =>
                    updateLocal(v.id, { priceCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })
                  }
                />
                <input
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
                  type="number"
                  min="0"
                  placeholder="المخزون"
                  value={v.stockQuantity}
                  onChange={(e) => updateLocal(v.id, { stockQuantity: Number(e.target.value) || 0 })}
                />
              </div>
              <Button size="sm" variant="outline" onClick={() => handleUpdate(v)} loading={busy === v.id}>
                حفظ
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">إضافة متغيّر جديد</p>
          <input
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            placeholder="مثال: أحمر - L"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
              type="number"
              min="0"
              placeholder="السعر (اختياري)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <input
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
              type="number"
              min="0"
              placeholder="المخزون"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
          </div>
          <ImageUploader value={newImage} onChange={setNewImage} folder="makramfy/products" label="صورة هذا المتغيّر (اختياري)" />
          <Button onClick={handleAdd} loading={adding} className="w-full">
            <Plus size={14} />
            إضافة المتغيّر
          </Button>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          إغلاق
        </Button>
      </div>
    </Modal>
  );
}
