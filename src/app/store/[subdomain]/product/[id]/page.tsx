import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedStore, getStoreProduct } from "@/actions/storefront";
import { ViewContentTracker } from "./ViewContentTracker";
import { ProductInteractive } from "./ProductInteractive";
import { ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ subdomain: string; id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { subdomain, id } = await params;
  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  const product = await getStoreProduct(store.org.id, id);
  if (!product) notFound();

  const firstVariant = product.variants[0];
  const initialPriceCents = firstVariant?.priceCents ?? product.basePriceCents;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ViewContentTracker productId={product.id} name={product.name} valueCents={initialPriceCents} />
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowRight size={14} />
        رجوع للمتجر
      </Link>

      <div>
        <ProductInteractive
          subdomain={subdomain}
          productId={product.id}
          name={product.name}
          categoryName={product.category?.name ?? null}
          slug={product.slug}
          basePriceCents={product.basePriceCents}
          imageUrl={product.imageUrl}
          images={product.images ?? []}
          variants={product.variants}
          themeColor={store.settings.themeColor}
        />
      </div>

      {product.description && (
        <p className="text-slate-600 text-sm mt-8 leading-relaxed max-w-2xl">{product.description}</p>
      )}
    </div>
  );
}
