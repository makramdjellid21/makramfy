import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MakramFy — أنشئ متجرك الإلكتروني في دقائق",
  description: "منصة جزائرية لإنشاء وإدارة متجرك الإلكتروني بسهولة، مع دفع محلي عبر Chargily Pay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
