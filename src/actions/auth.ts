"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  deleteSession,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateId } from "@/lib/utils";
import { checkLoginRateLimit, recordLoginAttempt, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function registerAction(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "خطأ في البيانات" };
  }

  const { name, email, password } = parsed.data;

  // Check if email already exists
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  const passwordHash = await hashPassword(password);
  const userId = generateId();

  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    updatedAt: new Date(),
  });

  const sessionId = await createSession(userId);
  await setSessionCookie(sessionId);

  return { success: true, data: { userId } };
}

export async function loginAction(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "خطأ في البيانات" };
  }

  const { email, password } = parsed.data;

  // Rate limiting: نحسب المحاولات حسب IP + البريد معًا حتى نمنع كل من:
  // (أ) بوت يجرب آلاف كلمات المرور على نفس البريد، و(ب) بوت يجرب من نفس الـIP على حسابات متعددة.
  const ip = await getClientIp();
  const ipKey = `ip:${ip}`;
  const emailKey = `email:${email}`;

  const [ipLimit, emailLimit] = await Promise.all([
    checkLoginRateLimit(ipKey),
    checkLoginRateLimit(emailKey),
  ]);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    return {
      success: false,
      error: "محاولات دخول كثيرة جدًا. يرجى الانتظار بضع دقائق ثم إعادة المحاولة",
    };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !user.passwordHash) {
    await Promise.all([recordLoginAttempt(ipKey, false), recordLoginAttempt(emailKey, false)]);
    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await Promise.all([recordLoginAttempt(ipKey, false), recordLoginAttempt(emailKey, false)]);
    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  await Promise.all([recordLoginAttempt(ipKey, true), recordLoginAttempt(emailKey, true)]);

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  return { success: true, data: { userId: user.id } };
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await deleteSession(session.id);
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "غير مصرح" };

  const name = formData.get("name") as string;
  const imageUrl = formData.get("imageUrl") as string;

  if (!name || name.trim().length < 2) {
    return { success: false, error: "الاسم يجب أن يكون حرفين على الأقل" };
  }

  await db
    .update(users)
    .set({ name: name.trim(), imageUrl: imageUrl || null, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return { success: true, data: undefined };
}

// ─── إعادة تعيين كلمة المرور ────────────────────────────────────────────────────
const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") as string });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "خطأ في البيانات" };
  }

  const { email } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email));

  // لا نكشف إن كان الإيميل موجودًا أو لا (لأسباب أمنية) — نرجّع نجاح دائمًا
  if (user && user.passwordHash) {
    const token = await createPasswordResetToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return { success: true, data: undefined };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, "رابط غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token") as string,
    password: formData.get("password") as string,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "خطأ في البيانات" };
  }

  const { token, password } = parsed.data;
  const record = await verifyPasswordResetToken(token);
  if (!record) {
    return { success: false, error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" };
  }

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId));
  await markPasswordResetTokenUsed(record.id);

  return { success: true, data: undefined };
}
