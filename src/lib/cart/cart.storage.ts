import { CART_STORAGE_KEY, CartState } from "./cart.types";

export function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;

    if (!parsed?.items || !Array.isArray(parsed.items)) return { items: [] };

    return {
      items: parsed.items
        .filter((i) => Number.isFinite(i.productId) && Number.isFinite(i.unitPriceCents))
        .map((i) => ({
          ...i,
          qty: Math.max(1, Number(i.qty || 1)),
        })),
    };
  } catch {
    return { items: [] };
  }
}

export function saveCart(state: CartState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
}

export function clearCartStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
}