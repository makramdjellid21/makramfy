"use server";

import { db } from "@/db";
import {
  organizations,
  storeSettings,
  products,
  customers,
  orders,
  orderItems,
  productVariants,
  subscriptions,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { createChargilyCheckout } from "@/lib/chargily";
import { getDeliveryPrice, getWilaya } from "@/lib/wilayas";
import { sendTelegramMessage, formatOrderNotification } from "@/lib/telegram";
import { createNotification } from "./notifications";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";
import { checkPhoneBlocked, checkOrderVelocity } from "@/lib/security";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

// ─── جلب متجر منشور عبر الـ subdomain ────────────────────────────────────────
export async function getPublishedStore(subdomain: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, subdomain));
  if (!org) return null;

  const [settings] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.organizationId, org.id));

  if (!settings?.isPublished) return null;

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, org.id));

  return { org, settings, plan: subscription?.plan ?? "free" };
}

// ─── جلب منتجات متجر (فقط المفعّلة) ──────────────────────────────────────────
export async function getStoreProducts(organizationId: string) {
  return db.query.products.findMany({
    where: and(eq(products.organizationId, organizationId), eq(products.isActive, true)),
    with: { category: true, variants: true },
  });
}

// ─── جلب منتج واحد عبر المعرّف (id) ────────────────────────────────────────────
// نعتمد الـ id بدل الـ slug في روابط المنتج لتفادي أي مشاكل ترميز محتملة
// مع الروابط التي تحتوي أحرف عربية على بعض بيئات الاستضافة/الـ proxy.
export async function getStoreProduct(organizationId: string, id: string) {
  return db.query.products.findFirst({
    where: and(
      eq(products.organizationId, organizationId),
      eq(products.id, id),
      eq(products.isActive, true)
    ),
    with: { category: true, variants: true },
  });
}

// ─── تتبع الطلبات برقم الهاتف (صفحة عامة للزبون) ──────────────────────────────
export async function getOrdersByPhone(organizationId: string, phone: string) {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return [];

  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.organizationId, organizationId), eq(customers.phone, cleanPhone)),
  });
  if (!customer) return [];

  return db.query.orders.findMany({
    where: eq(orders.customerId, customer.id),
    with: { items: true },
    orderBy: (o, { desc }) => desc(o.createdAt),
  });
}

// ─── جلب طلب واحد (لصفحة تأكيد الدفع بعد Chargily) ────────────────────────────
export async function getOrderById(organizationId: string, orderId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)),
    with: { items: true },
  });
}

// ─── إنشاء طلب من السلة (Checkout بدون بوابة دفع إلكتروني حاليًا - دفع عند الاستلام) ──
interface CartItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export async function createOrderAction(
  organizationId: string,
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    wilayaCode: number;
    commune: string;
    deliveryType: "home" | "desk";
  },
  items: CartItemInput[]
): Promise<ActionResult<{ orderId: string }>> {
  if (
    !customerInfo.name?.trim() ||
    !customerInfo.phone?.trim() ||
    !customerInfo.wilayaCode ||
    !customerInfo.commune?.trim()
  ) {
    return { success: false, error: "يرجى تعبئة كل بيانات التوصيل" };
  }
  if (!items.length) {
    return { success: false, error: "السلة فارغة" };
  }

  // ─── حماية من الطلبات الوهمية (COD) ────────────────────────────────────────
  // 1) رقم محظور (على مستوى هذا المتجر أو على مستوى المنصة كلها) → نرفض الطلب فورًا
  const blockCheck = await checkPhoneBlocked(organizationId, customerInfo.phone);
  if (blockCheck.blocked) {
    return {
      success: false,
      error: "تعذّر إتمام الطلب بهذا الرقم. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المتجر مباشرة",
    };
  }

  // 2) سرعة طلبات غير طبيعية من نفس الرقم عبر كل المنصة (بوت/محاولات متكررة) → نمنع مؤقتًا
  const velocity = await checkOrderVelocity(customerInfo.phone);
  if (velocity.suspicious) {
    return {
      success: false,
      error: "لقد قمت بعدة طلبات مؤخرًا من هذا الرقم. يرجى الانتظار قليلاً قبل المحاولة مجددًا",
    };
  }

  const wilaya = getWilaya(customerInfo.wilayaCode);
  if (!wilaya) {
    return { success: false, error: "الولاية غير صحيحة" };
  }
  const deliveryPriceDzd = getDeliveryPrice(customerInfo.wilayaCode, customerInfo.deliveryType) ?? 0;
  const deliveryPriceCents = Math.round(deliveryPriceDzd * 100);

  // نتحقق من المنتجات والمخزون ونحسب الإجمالي من قاعدة البيانات (وليس من الطلب المُرسل، حماية من التلاعب)
  let totalCents = deliveryPriceCents;
  const orderItemsData: {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string | null;
    unitPriceCents: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, item.productId),
        eq(products.organizationId, organizationId),
        eq(products.isActive, true)
      ),
      with: { variants: true },
    });
    if (!product) return { success: false, error: "أحد المنتجات لم يعد متوفرًا" };

    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) return { success: false, error: `المتغير غير موجود للمنتج ${product.name}` };
    if (variant.stockQuantity < item.quantity) {
      return { success: false, error: `الكمية غير متوفرة بالمخزون لمنتج "${product.name}"` };
    }

    const unitPriceCents = variant.priceCents ?? product.basePriceCents;
    totalCents += unitPriceCents * item.quantity;

    orderItemsData.push({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name === "افتراضي" ? null : variant.name,
      unitPriceCents,
      quantity: item.quantity,
    });
  }

  // البحث عن زبون سابق بنفس الرقم، أو إنشاء زبون جديد
  let [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.organizationId, organizationId), eq(customers.phone, customerInfo.phone.trim())));

  if (!customer) {
    const customerId = generateId();
    await db.insert(customers).values({
      id: customerId,
      organizationId,
      name: customerInfo.name.trim(),
      phone: customerInfo.phone.trim(),
      address: customerInfo.address?.trim() || null,
    });
    [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  }

  const orderId = generateId();
  await db.insert(orders).values({
    id: orderId,
    organizationId,
    customerId: customer.id,
    status: "pending",
    paymentStatus: "pending", // دفع عند الاستلام حاليًا؛ سيُستبدل بحالة Chargily لاحقًا
    totalCents,
    currency: "DZD",
    shippingAddress: customerInfo.address?.trim() || null,
    wilayaCode: customerInfo.wilayaCode,
    wilayaName: wilaya.name_ar,
    commune: customerInfo.commune.trim(),
    deliveryType: customerInfo.deliveryType,
    deliveryPriceCents,
    updatedAt: new Date(),
  });

  await db.insert(orderItems).values(
    orderItemsData.map((item) => ({
      id: generateId(),
      orderId,
      ...item,
    }))
  );

  // خصم الكمية من المخزون
  for (const item of orderItemsData) {
    await db
      .update(productVariants)
      .set({ stockQuantity: sql`GREATEST(stock_quantity - ${item.quantity}, 0)` })
      .where(eq(productVariants.id, item.variantId));
  }

  // إشعار Telegram لصاحب المتجر (اختياري، ما يوقف الطلب لو فشل)
  try {
    const [settings] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.organizationId, organizationId));

    if (settings?.telegramBotToken && settings?.telegramChatId) {
      const message = formatOrderNotification({
        orderId,
        customerName: customerInfo.name.trim(),
        customerPhone: customerInfo.phone.trim(),
        totalCents,
        wilayaName: wilaya.name_ar,
        commune: customerInfo.commune.trim(),
        deliveryType: customerInfo.deliveryType,
      });
      await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, message);
    }
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }

  // إشعار داخلي بلوحة التحكم (زر الجرس)
  try {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId));
    await createNotification(
      organizationId,
      "order",
      "طلب جديد 🎉",
      `${customerInfo.name.trim()} — ${(totalCents / 100).toLocaleString("ar-DZ")} د.ج`,
      `/dashboard/${org?.slug ?? ""}/orders`
    );
  } catch (err) {
    console.error("Internal notification failed:", err);
  }

  revalidatePath("/dashboard");
  return { success: true, data: { orderId } };
}

// ─── إنشاء عملية دفع إلكتروني عبر Chargily لطلب موجود ────────────────────────
export async function createOrderPaymentCheckoutAction(
  subdomain: string,
  organizationId: string,
  orderId: string,
  amountCents: number
): Promise<ActionResult<{ url: string }>> {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, organizationId));
  if ((sub?.plan ?? "free") === "free") {
    return { success: false, error: "الدفع الإلكتروني متاح فقط للمتاجر على الخطة الاحترافية أو أعمال" };
  }

  const result = await createChargilyCheckout({
    amount: Math.round(amountCents / 100),
    successUrl: `https://${subdomain}.${ROOT_DOMAIN}/order-success?order=${orderId}`,
    failureUrl: `https://${subdomain}.${ROOT_DOMAIN}/checkout?failed=1`,
    description: `طلب #${orderId.slice(0, 8)}`,
    metadata: { type: "order", orderId, organizationId },
  });

  if (!result.success) return { success: false, error: result.error };

  return { success: true, data: { url: result.checkout.checkout_url } };
}
