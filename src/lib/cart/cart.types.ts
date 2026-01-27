export type CartItem = {
  productId: number;
  name: string;
  unitPriceCents: number;
  imageUrl?: string;
  slug?: string;
  qty: number;
};

export type CartState = {
  items: CartItem[];
};

export const CART_STORAGE_KEY = "skolprojekt_cart_v1";