import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getGoogleAuthUrl, isGoogleAuthConfigured } from "@/lib/googleAuth";

export async function GET() {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 دقائق
    path: "/",
  });

  return NextResponse.redirect(getGoogleAuthUrl(state));
}
