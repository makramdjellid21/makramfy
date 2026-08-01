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
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow block"
    >
      <div className="relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
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
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 truncate">{name}</h3>
        <p className="text-sm font-bold mt-1" style={{ color: "var(--store-color, #16a34a)" }}>
          {formatDzd(priceCents)}
        </p>
      </div>
    </Link>
  );
}
