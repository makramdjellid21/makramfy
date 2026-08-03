"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { trackAddToCart } from "@/components/store/FacebookPixel";
import { formatDzd } from "@/lib/cart";
import { Minus, Plus, ShoppingCart, Check, Zap, Package } from "lucide-react";

interface Variant {
  id: string;
  name: string;
  priceCents: number | null;
  stockQuantity: number;
  imageUrl: string | null;
}

interface ProductInteractiveProps {
  subdomain: string;
  productId: string;
  name: string;
  categoryName: string | null;
  slug: string;
  basePriceCents: number;
  imageUrl: string | null;
  images: string[];
  variants: Variant[];
  themeColor: string;
}

export function ProductInteractive({
  subdomain,
  productId,
  name,
  categoryName,
  slug,
  basePriceCents,
  imageUrl,
  images,
  variants,
  themeColor,
}: ProductInteractiveProps) {
  const { add } = useCart(subdomain);
  const router = useRouter();

  const hasRealVariants = variants.length > 1;
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // معرض الصور: الصورة الرئيسية + الصور الإضافية، مع الأولوية لصورة المتغيّر المختار إن وُجدت
  const gallery = useMemo(() => {
    const base = [imageUrl, ...images].filter((u): u is string => Boolean(u));
    return base.length > 0 ? base : [];
  }, [imageUrl, images]);

  const variantImage = selectedVariant?.imageUrl ?? null;
  const [activeImage, setActiveImage] = useState<string | null>(variantImage ?? gallery[0] ?? null);

  function selectVariant(v: Variant) {
    setSelectedVariantId(v.id);
    if (v.imageUrl) setActiveImage(v.imageUrl);
  }

  const priceCents = selectedVariant?.priceCents ?? basePriceCents;
  const stock = selectedVariant?.stockQuantity ?? 0;
  const displayImage = activeImage ?? gallery[0] ?? null;

  function buildCartItem() {
    return {
      productId,
      variantId: selectedVariant.id,
      name,
      variantName: hasRealVariants ? selectedVariant.name : null,
      slug,
      priceCents,
      imageUrl: displayImage,
      quantity,
      maxStock: stock,
    };
  }

  function handleAdd() {
    add(buildCartItem());
    trackAddToCart({ id: productId, name, value: (priceCents * quantity) / 100, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    add(buildCartItem());
    trackAddToCart({ id: productId, name, value: (priceCents * quantity) / 100, quantity });
    router.push("/checkout");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* معرض الصور */}
      <div>
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt={name} className="w-full rounded-2xl object-cover aspect-square" />
        ) : (
          <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <Package size={48} className="text-slate-300" />
          </div>
        )}
        {gallery.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {gallery.map((img) => (
              <button
                key={img}
                onClick={() => setActiveImage(img)}
                className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors"
                style={{ borderColor: displayImage === img ? themeColor : "#e2e8f0" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* التفاصيل والشراء */}
      <div>
        {categoryName && <span className="text-xs text-slate-400">{categoryName}</span>}
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{name}</h1>
        <p className="text-2xl font-bold mt-3" style={{ color: themeColor }}>
          {formatDzd(priceCents)}
        </p>

        {hasRealVariants && (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700 mb-2">اختر:</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const outOfStock = v.stockQuantity === 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => !outOfStock && selectVariant(v)}
                    disabled={outOfStock}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={
                      isSelected
                        ? { backgroundColor: themeColor, borderColor: themeColor, color: "#fff" }
                        : { borderColor: "#e2e8f0", color: "#475569" }
                    }
                  >
                    {v.name}
                    {outOfStock && " (نفد)"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {stock === 0 ? (
            <div className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 text-center text-sm font-medium">
              نفد المخزون
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    className="h-11 w-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <button
                    className="h-11 w-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <Button className="flex-1" onClick={handleAdd} style={{ backgroundColor: added ? "#16a34a" : themeColor }}>
                  {added ? (
                    <>
                      <Check size={16} />
                      أُضيف للسلة
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      أضف للسلة
                    </>
                  )}
                </Button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: themeColor, filter: "brightness(0.85)" }}
              >
                <Zap size={16} fill="currentColor" />
                اشترِ الآن
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
