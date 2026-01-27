"use client";

import { useCart } from "@/lib/cart/cart.context";

type Props = {
  product: {
    id: number;
    name: string;
    price_cents: number;
    image_url?: string | null;
    slug?: string | null;
  };
  qty?: number;
};

export default function AddToCartButton({ product, qty = 1 }: Props) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      className="inline-flex h-10 items-center justify-center rounded-xl bg-black px-6 text-sm font-medium text-white"
      onClick={() =>
        addItem(
          {
            productId: product.id,
            name: product.name,
            unitPriceCents: product.price_cents,
            imageUrl: product.image_url ?? undefined,
            slug: product.slug ?? undefined,
          },
          qty
        )
      }
    >
      Lägg i varukorg
    </button>
  );
}