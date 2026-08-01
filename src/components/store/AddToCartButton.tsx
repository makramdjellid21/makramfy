"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { trackAddToCart } from "@/components/store/FacebookPixel";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";

interface AddToCartButtonProps {
  subdomain: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  priceCents: number;
  imageUrl: string | null;
  maxStock: number;
  themeColor: string;
}

export function AddToCartButton({
  subdomain,
  productId,
  variantId,
  name,
  slug,
  priceCents,
  imageUrl,
  maxStock,
  themeColor,
}: AddToCartButtonProps) {
  const { add } = useCart(subdomain);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (maxStock === 0) {
    return (
      <div className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 text-center text-sm font-medium">
        نفد المخزون
      </div>
    );
  }

  function handleAdd() {
    add({
      productId,
      variantId,
      name,
      variantName: null,
      slug,
      priceCents,
      imageUrl,
      quantity,
      maxStock,
    });
    trackAddToCart({ id: productId, name, value: (priceCents * quantity) / 100, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-3">
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
            onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
            disabled={quantity >= maxStock}
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

      {added && (
        <button
          onClick={() => router.push("/cart")}
          className="text-sm font-medium underline w-full text-center"
          style={{ color: themeColor }}
        >
          عرض السلة والمتابعة للدفع
        </button>
      )}
    </div>
  );
}
