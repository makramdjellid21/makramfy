import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedStore, getStoreProducts } from "@/actions/storefront";
import { ProductCard } from "@/components/store/ProductCard";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { SearchBar } from "@/components/store/SearchBar";
import {
  Package,
  Star,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Undo2,
  MessageCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function StoreHomePage({ params, searchParams }: PageProps) {
  const { subdomain } = await params;
  const { category: activeCategorySlug, search } = await searchParams;

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

  const searchTerm = search?.trim().toLowerCase();

  let visibleProducts = productList;
  if (searchTerm) {
    visibleProducts = productList.filter((p) => p.name.toLowerCase().includes(searchTerm));
  } else if (activeCategorySlug) {
    visibleProducts = productList.filter((p) => p.category?.slug === activeCategorySlug);
  }

  const isDefaultView = !searchTerm && !activeCategorySlug;
  const color = settings.themeColor;

  const features = [
    { icon: Truck, title: "توصيل لكل الولايات", desc: "خدمة توصيل سريعة وموثوقة" },
    { icon: ShieldCheck, title: "دفع عند الاستلام", desc: "ادفع فقط عند استلام طلبك" },
    { icon: Undo2, title: "إرجاع سهل", desc: "استبدال أو استرجاع بدون تعقيد" },
    {
      icon: MessageCircle,
      title: "دعم مباشر",
      desc: settings.phone ? "تواصل معنا في أي وقت" : "نحن هنا لمساعدتك",
    },
  ];

  return (
    <div>
      {/* Hero */}
      {isDefaultView && (
        <div className="relative overflow-hidden">
          {settings.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.bannerUrl}
              alt={org.name}
              className="w-full h-56 sm:h-72 md:h-96 object-cover"
            />
          ) : (
            <div
              className="relative w-full py-14 sm:py-20 md:py-28 px-4 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc 55%, #0f172a)`,
              }}
            >
              <div className="absolute -top-10 -right-10 w-56 h-56 sm:w-72 sm:h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-56 h-56 sm:w-72 sm:h-72 bg-white/10 rounded-full blur-3xl" />

              <div className="relative max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/20">
                  <ShoppingBag size={14} /> أهلاً بكم في متجرنا
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight">
                  {org.name}
                </h1>
                {settings.description && (
                  <p className="text-white/85 text-sm sm:text-lg max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                    {settings.description}
                  </p>
                )}
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:opacity-90 transition-all shadow-xl"
                  style={{ color }}
                >
                  <ShoppingBag size={18} /> تسوّق الآن
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features bar */}
      {isDefaultView && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 py-5 sm:py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-3">
                  <f.icon size={22} className="shrink-0" style={{ color }} />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{f.title}</p>
                    <p className="text-slate-500 text-[11px] sm:text-xs truncate">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {!settings.bannerUrl && !isDefaultView && settings.description && (
          <p className="text-slate-600 text-sm mb-6 max-w-2xl">{settings.description}</p>
        )}

        <SearchBar themeColor={color} defaultValue={search ?? ""} />

        {!searchTerm && <CategoryGrid categories={categoriesList} themeColor={color} />}

        {/* شريط التصنيفات */}
        {!searchTerm && categoriesList.length > 0 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <Link
              href="/"
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={
                !activeCategorySlug
                  ? { backgroundColor: color, borderColor: color, color: "#fff" }
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
                    ? { backgroundColor: color, borderColor: color, color: "#fff" }
                    : { borderColor: "#e2e8f0", color: "#475569" }
                }
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* منتجات مميزة */}
        {featuredProducts.length > 0 && isDefaultView && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star size={18} style={{ color }} fill={color} />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">منتجات مميزة</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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

        <h2 id="products" className="text-lg sm:text-xl font-bold text-slate-900 mb-4 scroll-mt-20">
          {searchTerm
            ? `نتائج البحث عن "${search}"`
            : activeCategorySlug
              ? (categoriesMap.get(activeCategorySlug)?.name ?? "منتجاتنا")
              : "كل المنتجات"}
        </h2>

        {visibleProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 sm:p-16 text-center">
            <Package size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">لا توجد منتجات هنا بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
