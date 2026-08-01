"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/components/store/FacebookPixel";

export function PurchaseTracker({ orderId, valueCents }: { orderId: string; valueCents: number }) {
  useEffect(() => {
    trackPurchase({ value: valueCents / 100, orderId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
