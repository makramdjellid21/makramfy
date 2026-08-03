import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { exchangeGoogleCodeForUser } from "@/lib/googleAuth";
import { createSession, setSessionCookie } from "@/lib/auth";
import { generateId } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=google_failed", APP_URL));
  }

  const googleUser = await exchangeGoogleCodeForUser(code);
  if (!googleUser || !googleUser.email) {
    return NextResponse.redirect(new URL("/login?error=google_failed", APP_URL));
  }

  // نبحث عن حساب موجود بنفس الإيميل، أو ننشئ حسابًا جديدًا بدون كلمة مرور
  let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

  if (!user) {
    const userId = generateId();
    await db.insert(users).values({
      id: userId,
      email: googleUser.email,
      name: googleUser.name ?? googleUser.email.split("@")[0],
      imageUrl: googleUser.picture ?? null,
      emailVerified: googleUser.email_verified ? new Date() : null,
      updatedAt: new Date(),
    });
    [user] = await db.select().from(users).where(eq(users.id, userId));
  }

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  return NextResponse.redirect(new URL("/dashboard", APP_URL));
}
