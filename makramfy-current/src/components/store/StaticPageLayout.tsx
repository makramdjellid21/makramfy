import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StaticPageLayoutProps {
  title: string;
  themeColor: string;
  children: React.ReactNode;
}

export function StaticPageLayout({ title, themeColor, children }: StaticPageLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowRight size={14} />
        رجوع للمتجر
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6" style={{ color: themeColor }}>
        {title}
      </h1>
      <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}
