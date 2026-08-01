interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<SendResult> {
  if (!botToken?.trim()) return { success: false, error: "لا يوجد Bot Token" };
  if (!chatId?.trim()) return { success: false, error: "لا يوجد Chat ID" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text,
        parse_mode: "HTML",
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      // تيليجرام يرجع رسائل خطأ واضحة، مثل: chat not found (المستخدم لم يبدأ محادثة مع البوت بعد)
      return { success: false, error: data.description || "فشل الإرسال" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function formatOrderNotification(order: {
  orderId: string;
  customerName: string;
  customerPhone: string | null;
  totalCents: number;
  wilayaName: string | null;
  commune: string | null;
  deliveryType: string | null;
}): string {
  return [
    "🎉 <b>طلب جديد!</b>",
    "",
    `👤 العميل: ${order.customerName}`,
    order.customerPhone ? `📞 الهاتف: ${order.customerPhone}` : "",
    order.wilayaName ? `📍 ${order.wilayaName}${order.commune ? " — " + order.commune : ""}` : "",
    order.deliveryType ? `🚚 ${order.deliveryType === "home" ? "توصيل منزلي" : "استلام من المكتب"}` : "",
    `💰 الإجمالي: ${(order.totalCents / 100).toLocaleString("ar-DZ")} د.ج`,
    "",
    `🔖 رقم الطلب: <code>${order.orderId.slice(0, 8)}</code>`,
  ]
    .filter(Boolean)
    .join("\n");
}
