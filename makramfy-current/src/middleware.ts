import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/pricing", "/login", "/register", "/api/health", "/api/webhooks"];
const AUTH_PATHS = ["/login", "/register"];

// الدومين الرئيسي للمنصة (بدون subdomain). في التطوير المحلي: localhost:3000
// في الإنتاج: makramfy.com (يُضبط عبر متغير البيئة ROOT_DOMAIN)
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

// subdomains محجوزة لا تُعتبر متجرًا (تستخدم للتطبيق نفسه)
const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api"]);

function isAdminHost(host: string): boolean {
  const hostWithoutPort = host.split(":")[0];
  const rootWithoutPort = ROOT_DOMAIN.split(":")[0];
  return hostWithoutPort === `admin.${rootWithoutPort}`;
}

function getSubdomain(host: string): string | null {
  // نزيل البورت إن وجد للمقارنة، لكن نحتفظ بالـ host الأصلي للتحويل
  const hostWithoutPort = host.split(":")[0];
  const rootWithoutPort = ROOT_DOMAIN.split(":")[0];

  if (hostWithoutPort === rootWithoutPort || hostWithoutPort === `www.${rootWithoutPort}`) {
    return null;
  }

  if (!hostWithoutPort.endsWith(`.${rootWithoutPort}`)) {
    return null; // دومين خارجي تمامًا (custom domain) - غير مدعوم بعد
  }

  const subdomain = hostWithoutPort.replace(`.${rootWithoutPort}`, "");
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) return null;

  return subdomain;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // ─── طلب جاي من لوحة الأدمن (admin.makramfy.com) ───
  // التحقق الفعلي من الجلسة وصلاحية isPlatformAdmin يتم داخل src/app/admin/layout.tsx
  // (يحتاج اتصال بقاعدة البيانات، وهذا غير متاح بـ middleware/edge runtime)
  if (isAdminHost(host)) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const subdomain = getSubdomain(host);

  // ─── طلب جاي من متجر (مثال: mystore.makramfy.com) ───
  if (subdomain) {
    // كل شي هنا public (واجهة المتجر للزبون النهائي)، نعيد التوجيه داخليًا
    // إلى مجموعة صفحات /store/[subdomain]/... بدون تغيير الرابط الظاهر للمستخدم
    const url = request.nextUrl.clone();
    url.pathname = `/store/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ─── طلب عادي على الدومين الرئيسي (لوحة التحكم + التسويقي) ───
  const sessionCookie = request.cookies.get("makramfy_session");
  const isAuthenticated = !!sessionCookie?.value;

  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api/webhooks")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    if (AUTH_PATHS.includes(pathname) && isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
