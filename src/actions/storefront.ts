"use server";

import { db, withOrgContext, withPlatformBypass } from "@/db";
import {
  organizations,
  storeSettings,
  products,
  customers,
  orders,
  orderItems,
  productVariants,
  subscriptions,
  blockedPhones,
} from "@/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { createChargilyCheckout } from "@/lib/chargily";
import { getDeliveryPrice, getWilaya } from "@/lib/wilayas";
import { sendTelegramMessage, formatOrderNotification } from "@/lib/telegram";
import { createNotification } from "./notifications";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";
import { checkCheckoutRateLimit, recordCheckoutAttempt, getClientIp } from "@/lib/rate-limit";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

// ─── جلب متجر منشور عبر الـ subdomain ────────────────────────────────────────
export async function getPublishedStore(subdomain: string) {
  // organizations/subscriptions خارج نطاق RLS حاليًا، فقط store_settings محمي
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, subdomain));
  if (!org) return null;

  const settings = await withOrgContext(org.id, async (tx) => {
    const [s] = await tx.select().from(storeSettings).where(eq(storeSettings.organizationId, org.id));
    return s;
  });

  if (!settings?.isPublished) return null;

  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, org.id));

  return { org, settings, plan: subscription?.plan ?? "free" };
}

// ─── جلب منتجات متجر (فقط المفعّلة) ──────────────────────────────────────────
export async function getStoreProducts(organizationId: string) {
  return withOrgContext(organizationId, (tx) =>
    tx.query.products.findMany({
      where: and(eq(products.organizationId, organizationId), eq(products.isActive, true)),
      with: { category: true, variants: true },
    })
  );
}

// ─── جلب منتج واحد عبر المعرّف (id) ────────────────────────────────────────────
// نعتمد الـ id بدل الـ slug في روابط المنتج لتفادي أي مشاكل ترميز محتملة
// مع الروابط التي تحتوي أحرف عربية على بعض بيئات الاستضافة/الـ proxy.
export async function getStoreProduct(organizationId: string, id: string) {
  return withOrgContext(organizationId, (tx) =>
    tx.query.products.findFirst({
      where: and(
        eq(products.organizationId, organizationId),
        eq(products.id, id),
        eq(products.isActive, true)
      ),
      with: { category: true, variants: true },
    })
  );
}

// ─── تتبع الطلبات برقم الهاتف (صفحة عامة للزبون) ──────────────────────────────
export async function getOrdersByPhone(organizationId: string, phone: string) {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return [];

  // حماية من استنزاف الأرقام (Enumeration/Scraping) — نفس آلية حماية الدفع
  const ip = await getClientIp();
  const rateLimit = await checkCheckoutRateLimit(`track:${ip}`);
  if (!rateLimit.allowed) return []; // رد صامت (مو رسالة خطأ) حتى لا نكشف وجود الحماية

  await recordCheckoutAttempt(`track:${ip}`);

  return withOrgContext(organizationId, async (tx) => {
    const customer = await tx.query.customers.findFirst({
      where: and(eq(customers.organizationId, organizationId), eq(customers.phone, cleanPhone)),
    });
    if (!customer) return [];

    return tx.query.orders.findMany({
      where: eq(orders.customerId, customer.id),
      with: { items: true },
      orderBy: (o, { desc }) => desc(o.createdAt),
    });
  });
}

// ─── جلب طلب واحد (لصفحة تأكيد الدفع بعد Chargily) ────────────────────────────
export async function getOrderById(organizationId: string, orderId: string) {
  return withOrgContext(organizationId, (tx) =>
    tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)),
      with: { items: true },
    })
  );
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

  const wilaya = getWilaya(customerInfo.wilayaCode);
  if (!wilaya) {
    return { success: false, error: "الولاية غير صحيحة" };
  }

  // ─── الحماية من الطلبات الوهمية ─────────────────────────────────────────────
  // 0) Rate limiting حسب IP: يمنع بوت من إغراق المتجر بطلبات وهمية بأرقام مختلفة
  // (checkout_attempts مفتاحها IP وليست جدولًا خاصًا بمتجر، فهي خارج نطاق RLS)
  const ip = await getClientIp();
  const ipKey = `ip:${ip}`;
  const ipLimit = await checkCheckoutRateLimit(ipKey);
  if (!ipLimit.allowed) {
    return {
      success: false,
      error: "عدد كبير من الطلبات من نفس الجهاز خلال وقت قصير. يرجى الانتظار قليلاً ثم إعادة المحاولة",
    };
  }
  await recordCheckoutAttempt(ipKey);

  const phone = customerInfo.phone.trim();

  // 1) رقم محظور (على مستوى هذا المتجر أو على مستوى المنصة كلها) — withOrgContext
  // يفتح صفوف هذا المتجر + صفوف حظر المنصة (organization_id IS NULL) حسب سياسة RLS
  const [blocked] = await withOrgContext(organizationId, (tx) =>
    tx
      .select()
      .from(blockedPhones)
      .where(
        and(
          eq(blockedPhones.phone, phone),
          or(eq(blockedPhones.organizationId, organizationId), isNull(blockedPhones.organizationId))
        )
      )
  );

  if (blocked) {
    return { success: false, error: "تعذّر إتمام الطلب. يرجى التواصل مباشرة مع المتجر لإتمام عملية الشراء." };
  }

  // 2) عدد كبير من الطلبات بوقت قصير من نفس الرقم عبر كل المنصة (نمط بوت/إزعاج متكرر)
  // bypass مبرر: فحص أمني نظامي عبر كل المتاجر، وليس عرض بيانات لمستخدم غير مخوّل
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [recentCount] = await withPlatformBypass((tx) =>
    tx
      .select({ value: sql<number>`count(*)` })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(customers.phone, phone), sql`${orders.createdAt} > ${oneHourAgo}`))
  );

  if (Number(recentCount?.value ?? 0) >= 4) {
    return { success: false, error: "لقد قمت بعدد كبير من الطلبات مؤخرًا. يرجى المحاولة لاحقًا أو التواصل مع المتجر." };
  }

  const deliveryPriceDzd = getDeliveryPrice(customerInfo.wilayaCode, customerInfo.deliveryType) ?? 0;
  const deliveryPriceCents = Math.round(deliveryPriceDzd * 100);

  const result = await withOrgContext(organizationId, async (tx) => {
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
      const product = await tx.query.products.findFirst({
        where: and(
          eq(products.id, item.productId),
          eq(products.organizationId, organizationId),
          eq(products.isActive, true)
        ),
        with: { variants: true },
      });
      if (!product) return { success: false, error: "أحد المنتجات لم يعد متوفرًا" } as const;

      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) return { success: false, error: `المتغير غير موجود للمنتج ${product.name}` } as const;
      if (variant.stockQuantity < item.quantity) {
        return { success: false, error: `الكمية غير متوفرة بالمخزون لمنتج "${product.name}"` } as const;
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
    let [customer] = await tx
      .select()
      .from(customers)
      .where(and(eq(customers.organizationId, organizationId), eq(customers.phone, customerInfo.phone.trim())));

    if (!customer) {
      const customerId = generateId();
      await tx.insert(customers).values({
        id: customerId,
        organizationId,
        name: customerInfo.name.trim(),
        phone: customerInfo.phone.trim(),
        address: customerInfo.address?.trim() || null,
      });
      [customer] = await tx.select().from(customers).where(eq(customers.id, customerId));
    }

    const orderId = generateId();
    await tx.insert(orders).values({
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

    await tx.insert(orderItems).values(
      orderItemsData.map((item) => ({
        id: generateId(),
        orderId,
        ...item,
      }))
    );

    // خصم الكمية من المخزون
    for (const item of orderItemsData) {
      await tx
        .update(productVariants)
        .set({ stockQuantity: sql`GREATEST(stock_quantity - ${item.quantity}, 0)` })
        .where(eq(productVariants.id, item.variantId));
    }

    return { success: true, orderId, totalCents } as const;
  });

  if (!result.success) return { success: false, error: result.error };
  const { orderId, totalCents } = result;

  // إشعار Telegram لصاحب المتجر (اختياري، ما يوقف الطلب لو فشل)
  try {
    const settings = await withOrgContext(organizationId, async (tx) => {
      const [s] = await tx.select().from(storeSettings).where(eq(storeSettings.organizationId, organizationId));
      return s;
    });

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

  const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.organizationId, organizationId));
  if (!settings?.chargilySecretKey) {
    return { success: false, error: "المتجر لم يفعّل الدفع الإلكتروني بعد. يرجى التواصل معه أو اختيار الدفع عند الاستلام." };
  }

  const result = await createChargilyCheckout(
    {
      amount: Math.round(amountCents / 100),
      successUrl: `https://${subdomain}.${ROOT_DOMAIN}/order-success?order=${orderId}`,
      failureUrl: `https://${subdomain}.${ROOT_DOMAIN}/checkout?failed=1`,
      description: `طلب #${orderId.slice(0, 8)}`,
      metadata: { type: "order", orderId, organizationId },
    },
    settings.chargilySecretKey
  );

  if (!result.success) return { success: false, error: result.error };

  return { success: true, data: { url: result.checkout.checkout_url } };
}
