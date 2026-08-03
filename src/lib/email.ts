const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * يرسل إيميل عبر Resend مباشرة (بدون حزمة npm إضافية).
 * يتطلب متغيرات البيئة التالية على Vercel:
 *   RESEND_API_KEY=مفتاح Resend
 *   RESEND_FROM_EMAIL="اسم <noreply@your-domain.com>"  (اختياري، افتراضيًا onboarding@resend.dev)
 */
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY غير مضبوط — لا يمكن إرسال الإيميل");
    return { success: false as const, error: "خدمة الإيميل غير مفعّلة حاليًا" };
  }

  const from = process.env.RESEND_FROM_EMAIL || "MakramFy <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("فشل إرسال الإيميل عبر Resend:", res.status, body);
      return { success: false as const, error: "تعذّر إرسال البريد، حاول لاحقًا" };
    }

    return { success: true as const };
  } catch (err) {
    console.error("خطأ في الاتصال بـ Resend:", err);
    return { success: false as const, error: "تعذّر إرسال البريد، حاول لاحقًا" };
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "إعادة تعيين كلمة المرور — MakramFy",
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7c3aed;">إعادة تعيين كلمة المرور</h2>
        <p style="color: #334155; line-height: 1.7;">
          وصلنا طلب لإعادة تعيين كلمة مرور حسابك على MakramFy. اضغط الزر أدناه لاختيار كلمة مرور جديدة.
          هذا الرابط صالح لمدة ساعة واحدة فقط.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #7c3aed; color: #fff; text-decoration: none;
                  padding: 12px 28px; border-radius: 12px; font-weight: bold; margin: 16px 0;">
          إعادة تعيين كلمة المرور
        </a>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          إذا لم تطلب هذا، تجاهل هذا الإيميل ببساطة — حسابك آمن ولن يتغير شيء.
        </p>
      </div>
    `,
  });
}
