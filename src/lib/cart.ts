export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string | null;
  slug: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
}

function cartKey(subdomain: string) {
  return `makramfy_cart_${subdomain}`;
}

export function getCart(subdomain: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cartKey(subdomain));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(subdomain: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cartKey(subdomain), JSON.stringify(items));
  window.dispatchEvent(new Event("makramfy-cart-updated"));
}

export function addToCart(subdomain: string, item: CartItem) {
  const items = getCart(subdomain);
  const existing = items.find((i) => i.variantId === item.variantId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, item.maxStock);
  } else {
    items.push(item);
  }
  saveCart(subdomain, items);
  return items;
}

export function updateCartQuantity(subdomain: string, variantId: string, quantity: number) {
  let items = getCart(subdomain);
  if (quantity <= 0) {
    items = items.filter((i) => i.variantId !== variantId);
  } else {
    items = items.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(quantity, i.maxStock) } : i));
  }
  saveCart(subdomain, items);
  return items;
}

export function removeFromCart(subdomain: string, variantId: string) {
  const items = getCart(subdomain).filter((i) => i.variantId !== variantId);
  saveCart(subdomain, items);
  return items;
}

export function clearCart(subdomain: string) {
  saveCart(subdomain, []);
}

export function cartTotalCents(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function formatDzd(cents: number) {
  return `${(cents / 100).toLocaleString("ar-DZ")} د.ج`;
}
