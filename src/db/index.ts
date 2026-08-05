import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// إسكات تحذير Node عن sslmode=require (alias قديم لـ verify-full) بدون تغيير السلوك الفعلي
function withLibpqCompat(url: string): string {
  if (url.includes("uselibpqcompat=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}uselibpqcompat=true`;
}

const resolvedDatabaseUrl = withLibpqCompat(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: resolvedDatabaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });

// ─── عزل بيانات التجار (Row-Level Security) ────────────────────────────────
// كل استعلام يلمس جداول بيانات المتجر (منتجات/طلبات/زبائن/تصنيفات/إعدادات
// المتجر/الأرقام المحظورة) لازم يمر من هنا. نضبط متغير جلسة Postgres داخل
// transaction عبر set_config (بارامتر حقيقي، آمن من الحقن) بحيث حتى لو نسينا
// فلتر organizationId باستعلام مستقبلي، الـ RLS بقاعدة البيانات يمنع تسرب
// صفوف متجر آخر. راجع src/db/rls-policies.sql للسياسات الفعلية، ولازم
// تشغيله يدويًا مرة واحدة على قاعدة البيانات (drizzle-kit push لا يديرها).
export async function withOrgContext<T>(
  organizationId: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${organizationId}, true)`);
    return fn(tx as typeof db);
  });
}

// للعمليات التي تحتاج شرعًا رؤية بيانات كل المتاجر (لوحة أدمن المنصة، أو
// webhook موقّع من مزوّد دفع خارجي) — تُستخدم فقط بعد التحقق من الصلاحية/التوقيع.
export async function withPlatformBypass<T>(fn: (tx: typeof db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
    return fn(tx as typeof db);
  });
}
