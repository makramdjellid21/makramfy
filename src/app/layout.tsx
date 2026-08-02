import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MakramFy — أنشئ متجرك الإلكتروني في دقائق",
  description: "منصة جزائرية لإنشاء وإدارة متجرك الإلكتروني بسهولة، مع دفع محلي عبر Chargily Pay.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
