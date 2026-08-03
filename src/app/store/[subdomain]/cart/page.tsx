"use client";

import { use } from "react";
import { CartPanel } from "@/components/store/CartPanel";
import { useStoreTheme } from "@/hooks/useStoreTheme";

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default function CartPage({ params }: PageProps) {
  const { subdomain } = use(params);
  const themeColor = useStoreTheme();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900 mb-2">سلة المشتريات</h1>
      <CartPanel subdomain={subdomain} themeColor={themeColor} />
    </div>
  );
}
