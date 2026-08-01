import { db } from "@/db";
import { orders, subscriptions } from "@/db/schema";
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

  if (!verifyChargilySignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: ChargilyEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const checkout = event.data;
    const metadata = checkout.metadata ?? {};

    if (event.type === "checkout.paid") {
      if (metadata.type === "order" && metadata.orderId) {
        await db
          .update(orders)
          .set({ paymentStatus: "paid", chargilyCheckoutId: checkout.id, updatedAt: new Date() })
          .where(eq(orders.id, metadata.orderId));
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
        await db
          .update(orders)
          .set({ paymentStatus: "failed", updatedAt: new Date() })
          .where(eq(orders.id, metadata.orderId));
      }
    }
  } catch (err) {
    console.error("Error handling Chargily webhook event:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
