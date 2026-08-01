"use client";

import Script from "next/script";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

interface FacebookPixelProps {
  pixelId: string | null;
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  if (!pixelId) return null;

  return (
    <Script id="fb-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}

/**
 * دوال مساعدة لتتبع الأحداث القياسية، تُستدعى من أي مكوّن.
 * كل دالة تتحقق أولاً من وجود fbq (قد لا يكون محمَّلاً بعد أو لا يوجد Pixel ID أصلاً)
 */
export function trackViewContent(params: { name: string; id: string; value: number }) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_name: params.name,
      content_ids: [params.id],
      content_type: "product",
      value: params.value,
      currency: "DZD",
    });
  }
}

export function trackAddToCart(params: { name: string; id: string; value: number; quantity?: number }) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddToCart", {
      content_name: params.name,
      content_ids: [params.id],
      content_type: "product",
      value: params.value,
      currency: "DZD",
      contents: [{ id: params.id, quantity: params.quantity || 1 }],
    });
  }
}

export function trackInitiateCheckout(params: { value: number; numItems: number }) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      value: params.value,
      currency: "DZD",
      num_items: params.numItems,
    });
  }
}

export function trackPurchase(params: { value: number; orderId: string }) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", {
      value: params.value,
      currency: "DZD",
      content_ids: [params.orderId],
    });
  }
}
