"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/components/store/FacebookPixel";

export function ViewContentTracker({
  productId,
  name,
  valueCents,
}: {
  productId: string;
  name: string;
  valueCents: number;
}) {
  useEffect(() => {
    trackViewContent({ id: productId, name, value: valueCents / 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
