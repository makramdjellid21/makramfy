"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Store,
  Menu,
  X,
  MessageCircle,
  Send,
  Mail,
  MapPin,
  Truck,
  ChevronLeft,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { CartPanel } from "@/components/store/CartPanel";

// lucide-react removed the brand icons (Facebook, Instagram) from its exports,
// so these are small inline replacements with the same `size` prop signature.
function Instagram({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function Facebook({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface StoreHeaderProps {
  subdomain: string;
  storeName: string;
  description: string | null;
  logoUrl: string | null;
  themeColor: string;
  announcementText: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTelegramChannel: string | null;
  socialWhatsapp: string | null;
  categories: Category[];
}

export function StoreHeader({
  subdomain,
  storeName,
  description,
  logoUrl,
  themeColor,
  announcementText,
  phone,
  email,
  address,
  socialInstagram,
  socialFacebook,
  socialTelegramChannel,
  socialWhatsapp,
  categories,
}: StoreHeaderProps) {
  const { count, ready } = useCart(subdomain);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const socials = [
    socialWhatsapp && { icon: MessageCircle, href: `https://wa.me/${socialWhatsapp.replace(/\D/g, "")}` },
    socialTelegramChannel && { icon: Send, href: socialTelegramChannel },
    socialInstagram && { icon: Instagram, href: socialInstagram },
    socialFacebook && { icon: Facebook, href: socialFacebook },
  ].filter(Boolean) as { icon: typeof MessageCircle; href: string }[];

  const infoLinks = [
    { label: "من نحن", href: "/about" },
    { label: "سياسة الإرجاع", href: "/returns" },
    { label: "سياسة الخصوصية", href: "/privacy" },
    { label: "شروط الاستخدام", href: "/terms" },
    { label: "تتبع الطلب", href: "/track" },
  ];

  return (
    <>
      {announcementText && (
        <div
          className="text-center text-xs sm:text-sm font-medium py-2 px-4"
          style={{ backgroundColor: themeColor, color: "#fff" }}
        >
          {announcementText}
        </div>
      )}

      <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="relative flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-50 transition-colors shrink-0"
            aria-label="القائمة"
          >
            <Menu size={22} className="text-slate-700" />
          </button>

          <Link href="/" className="flex items-center gap-2 min-w-0 flex-1 justify-center sm:justify-start">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={storeName} className="h-9 w-9 rounded-lg object-cover shrink-0" />
            ) : (
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <Store size={18} style={{ color: themeColor }} />
              </div>
            )}
            <span className="font-bold text-slate-900 truncate">{storeName}</span>
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-50 transition-colors shrink-0"
            aria-label="السلة"
          >
            <ShoppingCart size={20} className="text-slate-700" />
            {ready && count > 0 && (
              <span
                className="absolute -top-1 -left-1 h-5 w-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: themeColor }}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* القائمة الجانبية (Drawer) */}
      {menuOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-950 text-slate-100 overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={storeName} className="h-11 w-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${themeColor}30` }}
                    >
                      <Store size={20} style={{ color: themeColor }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold truncate">{storeName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-800 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {description && <p className="text-sm text-slate-400 mb-5 leading-relaxed">{description}</p>}

              {socials.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  {socials.map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-colors"
                      style={{ color: themeColor }}
                    >
                      <s.icon size={17} />
                    </a>
                  ))}
                </div>
              )}

              {categories.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white mb-2">تصفح المتجر</h3>
                  <div className="space-y-0.5">
                    {categories.map((cat) => {
                      const Icon = getCategoryIcon(cat.name);
                      return (
                        <Link
                          key={cat.id}
                          href={`/?category=${cat.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={15} style={{ color: themeColor }} />
                            {cat.name}
                          </span>
                          <ChevronLeft size={14} className="text-slate-600" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-2">معلومات</h3>
                <div className="space-y-0.5">
                  {infoLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                    >
                      {link.label}
                      <ChevronLeft size={14} className="text-slate-600" />
                    </Link>
                  ))}
                </div>
              </div>

              {(phone || email || address) && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white mb-2">تواصل معنا</h3>
                  <div className="space-y-2.5 text-sm text-slate-300">
                    {email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} style={{ color: themeColor }} />
                        <span dir="ltr">{email}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-2">
                        <MessageCircle size={14} style={{ color: themeColor }} />
                        <span dir="ltr">{phone}</span>
                      </div>
                    )}
                    {address && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: themeColor }} />
                        {address}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-slate-900 p-4">
                <p className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Truck size={16} style={{ color: themeColor }} />
                  توصيل سريع
                </p>
                <p className="text-xs text-slate-400">لكل ولايات الجزائر خلال أيام معدودة</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* سلة المشتريات (Drawer) */}
      {cartOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-96 max-w-[90vw] bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between z-10">
              <h2 className="font-bold text-slate-900">سلة المشتريات</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100"
              >
                <X size={18} className="text-slate-600" />
              </button>
            </div>
            <CartPanel subdomain={subdomain} themeColor={themeColor} onNavigate={() => setCartOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
