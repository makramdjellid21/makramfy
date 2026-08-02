import Link from "next/link";
import { Package } from "lucide-react";
import { formatDzd } from "@/lib/cart";

interface ProductCardProps {
  slug: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
  inStock: boolean;
}

export function ProductCard({ slug, name, imageUrl, priceCents, inStock }: ProductCardProps) {
  return (
    <Link
      href={`/product/${slug}`}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg active:scale-[0.98] transition-all block touch-manipulation"
    >
      <div className="relative aspect-square">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <Package size={32} className="text-slate-300" />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full">
              نفد المخزون
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.2em]">{name}</h3>
        <p className="text-sm font-bold mt-1" style={{ color: "var(--store-color, #16a34a)" }}>
          {formatDzd(priceCents)}
        </p>
      </div>
    </Link>
  );
}
