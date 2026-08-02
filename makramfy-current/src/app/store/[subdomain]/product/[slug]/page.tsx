import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedStore, getStoreProduct } from "@/actions/storefront";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ViewContentTracker } from "./ViewContentTracker";
import { formatDzd } from "@/lib/cart";
import { ArrowRight, Package } from "lucide-react";

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { subdomain, slug } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  const product = await getStoreProduct(store.org.id, slug);
  if (!product) notFound();

  const variant = product.variants[0];
  const stock = variant?.stockQuantity ?? 0;
  const priceCents = variant?.priceCents ?? product.basePriceCents;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ViewContentTracker productId={product.id} name={product.name} valueCents={priceCents} />
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowRight size={14} />
        رجوع للمتجر
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full rounded-2xl object-cover aspect-square" />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Package size={48} className="text-slate-300" />
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <span className="text-xs text-slate-400">{product.category.name}</span>
          )}
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{product.name}</h1>
          <p className="text-2xl font-bold mt-3" style={{ color: store.settings.themeColor }}>
            {formatDzd(priceCents)}
          </p>

          {product.description && (
            <p className="text-slate-600 text-sm mt-4 leading-relaxed">{product.description}</p>
          )}

          <div className="mt-6">
            {variant && (
              <AddToCartButton
                subdomain={subdomain}
                productId={product.id}
                variantId={variant.id}
                name={product.name}
                slug={product.slug}
                priceCents={priceCents}
                imageUrl={product.imageUrl}
                maxStock={stock}
                themeColor={store.settings.themeColor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
