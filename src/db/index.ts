import { drizzle } from "drizzle-orm/node-postgres";
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
