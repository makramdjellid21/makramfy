import Link from "next/link";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryGridProps {
  categories: Category[];
  themeColor: string;
}

export function CategoryGrid({ categories, themeColor }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-10">
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.name);
        return (
          <Link
            key={cat.id}
            href={`/?category=${cat.slug}`}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${themeColor}15` }}
            >
              <Icon size={20} style={{ color: themeColor }} />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center truncate w-full">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
