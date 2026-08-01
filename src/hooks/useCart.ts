"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type CartItem,
  getCart,
  addToCart as addToCartUtil,
  updateCartQuantity as updateCartQuantityUtil,
  removeFromCart as removeFromCartUtil,
  clearCart as clearCartUtil,
  cartCount,
  cartTotalCents,
} from "@/lib/cart";

export function useCart(subdomain: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setItems(getCart(subdomain));
  }, [subdomain]);

  useEffect(() => {
    refresh();
    setReady(true);
    window.addEventListener("makramfy-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("makramfy-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const add = useCallback(
    (item: CartItem) => {
      addToCartUtil(subdomain, item);
    },
    [subdomain]
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      updateCartQuantityUtil(subdomain, variantId, quantity);
    },
    [subdomain]
  );

  const remove = useCallback(
    (variantId: string) => {
      removeFromCartUtil(subdomain, variantId);
    },
    [subdomain]
  );

  const clear = useCallback(() => {
    clearCartUtil(subdomain);
  }, [subdomain]);

  return {
    items,
    ready,
    count: cartCount(items),
    totalCents: cartTotalCents(items),
    add,
    updateQuantity,
    remove,
    clear,
  };
}
