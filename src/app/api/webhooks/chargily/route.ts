import { db, withPlatformBypass } from "@/db";
import { orders, subscriptions, storeSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyChargilySignature } from "@/lib/chargily";

export const dynamic = "force-dynamic";

interface ChargilyEvent {
  type: string;
  data: {
    id: string;
    status: string;
    amount: number;
    metadata: Record<string, string> | null;
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("signature");

  // نحتاج نطّلع على metadata أولًا (بدون أي ثقة بمحتواها بعد) فقط لنعرف
  // بأي مفتاح نتحقق من التوقيع — كل متجر عنده مفتاح Chargily مختلف.
  let peekedEvent: ChargilyEvent;
  try {
    peekedEvent = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const peekedMetadata = peekedEvent.data?.metadata ?? {};
  let secretKeyOverride: string | undefined;

  if (peekedMetadata.type === "order" && peekedMetadata.organizationId) {
    const [settings] = await withPlatformBypass((tx) =>
      tx.select().from(storeSettings).where(eq(storeSettings.organizationId, peekedMetadata.organizationId))
    );
    if (!settings?.chargilySecretKey) {
      // لا مفتاح مخزّن لهذا المتجر = لا يمكن التحقق من التوقيع بأمان، نرفض
      return Response.json({ error: "Unknown store" }, { status: 403 });
    }
    secretKeyOverride = settings.chargilySecretKey;
  }
  // النوع "subscription" (اشتراك التاجر بالمنصة) يتحقق بمفتاح المنصة الافتراضي

  if (!verifyChargilySignature(rawBody, signature, secretKeyOverride)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  const event = peekedEvent;

  try {
    const checkout = event.data;
    const metadata = checkout.metadata ?? {};

    if (event.type === "checkout.paid") {
      if (metadata.type === "order" && metadata.orderId) {
        // orders محمي بـ RLS، ولا نملك organizationId هنا (Chargily ما يرجعه
        // لطلبات COD) — bypass مبرر: الطلب موقّع ومتحقق منه أعلاه بالتوقيع.
        await withPlatformBypass((tx) =>
          tx
            .update(orders)
            .set({ paymentStatus: "paid", chargilyCheckoutId: checkout.id, updatedAt: new Date() })
            .where(eq(orders.id, metadata.orderId))
        );
      }

      if (metadata.type === "subscription" && metadata.organizationId && metadata.plan) {
        const plan = metadata.plan as "pro" | "business";
        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.organizationId, metadata.organizationId));

        if (existing) {
          await db
            .update(subscriptions)
            .set({ plan, status: "active", updatedAt: new Date() })
            .where(eq(subscriptions.organizationId, metadata.organizationId));
        } else {
          await db.insert(subscriptions).values({
            id: crypto.randomUUID(),
            organizationId: metadata.organizationId,
            plan,
            status: "active",
            updatedAt: new Date(),
          });
        }
      }
    }

    if (event.type === "checkout.failed" || event.type === "checkout.expired") {
      if (metadata.type === "order" && metadata.orderId) {
        await withPlatformBypass((tx) =>
          tx
            .update(orders)
            .set({ paymentStatus: "failed", updatedAt: new Date() })
            .where(eq(orders.id, metadata.orderId))
        );
      }
    }
  } catch (err) {
    console.error("Error handling Chargily webhook event:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
