import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedStore, getStoreProducts } from "@/actions/storefront";
import { ProductCard } from "@/components/store/ProductCard";
import { Package, Star } from "lucide-react";

interface PageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function StoreHomePage({ params, searchParams }: PageProps) {
  const { subdomain } = await params;
  const { category: activeCategorySlug } = await searchParams;

  const store = await getPublishedStore(subdomain);
  if (!store) notFound();

  const { org, settings } = store;
  const productList = await getStoreProducts(org.id);

  // نستخرج التصنيفات الفعلية اللي عندها منتجات فقط
  const categoriesMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const p of productList) {
    if (p.category) categoriesMap.set(p.category.slug, p.category);
  }
  const categoriesList = Array.from(categoriesMap.values());

  const featuredProducts = productList.filter((p) => p.isFeatured);

  const visibleProducts = activeCategorySlug
    ? productList.filter((p) => p.category?.slug === activeCategorySlug)
    : productList;

  return (
    <div>
      {settings.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.bannerUrl} alt={org.name} className="w-full h-48 md:h-64 object-cover" />
      ) : (
        <div
          className="w-full h-40 md:h-52 flex items-center justify-center"
          style={{ backgroundColor: `${settings.themeColor}15` }}
        >
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: settings.themeColor }}>
            {org.name}
          </h1>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {settings.description && <p className="text-slate-600 text-sm mb-6 max-w-2xl">{settings.description}</p>}

        {/* شريط التصنيفات */}
        {categoriesList.length > 0 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <Link
              href="/"
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={
                !activeCategorySlug
                  ? { backgroundColor: settings.themeColor, borderColor: settings.themeColor, color: "#fff" }
                  : { borderColor: "#e2e8f0", color: "#475569" }
              }
            >
              الكل
            </Link>
            {categoriesList.map((cat) => (
              <Link
                key={cat.id}
                href={`/?category=${cat.slug}`}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={
                  activeCategorySlug === cat.slug
                    ? { backgroundColor: settings.themeColor, borderColor: settings.themeColor, color: "#fff" }
                    : { borderColor: "#e2e8f0", color: "#475569" }
                }
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* منتجات مميزة */}
        {featuredProducts.length > 0 && !activeCategorySlug && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} style={{ color: settings.themeColor }} fill={settings.themeColor} />
              <h2 className="text-lg font-bold text-slate-900">منتجات مميزة</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => {
                const stock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                return (
                  <ProductCard
                    key={product.id}
                    slug={product.slug}
                    name={product.name}
                    imageUrl={product.imageUrl}
                    priceCents={product.basePriceCents}
                    inStock={stock > 0}
                  />
                );
              })}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {activeCategorySlug ? categoriesMap.get(activeCategorySlug)?.name ?? "منتجاتنا" : "كل المنتجات"}
        </h2>

        {visibleProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <Package size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">لا توجد منتجات هنا بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product) => {
              const stock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
              return (
                <ProductCard
                  key={product.id}
                  slug={product.slug}
                  name={product.name}
                  imageUrl={product.imageUrl}
                  priceCents={product.basePriceCents}
                  inStock={stock > 0}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
