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
};

export default function AddToCartMini({ product }: Props) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
      onClick={() =>
        addItem(
          {
            productId: product.id,
            name: product.name,
            unitPriceCents: product.price_cents,
            imageUrl: product.image_url ?? undefined,
            slug: product.slug ?? undefined,
          },
          1
        )
      }
    >
      Lägg i varukorg
    </button>
  );
}