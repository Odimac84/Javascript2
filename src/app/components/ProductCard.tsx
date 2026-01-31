import Link from "next/link";
import { formatSEK, type Product } from "@/lib/api";
import AddToCartMini from "@/app/components/AddToCartMini.client";
import { normalizeImageUrl } from "@/lib/images";

function isNew(publishedAt?: string | null) {
  if (!publishedAt) return false;
  const published = new Date(publishedAt).getTime();
  const now = Date.now();
  const diffDays = (now - published) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

export default function ProductCard({
  p,
}: {
  p: Product & { image_url?: string | null };
}) {
  const showNew = isNew(p.published_at);
  const src = normalizeImageUrl(p.image_url);

  return (
    <div className="rounded-xl border bg-white p-3">
      <Link href={`/products/${p.slug}`} className="block">
        <div className="overflow-hidden rounded-lg border">
          <div
            className="relative w-full overflow-hidden rounded-xl border bg-gray-100 "
            style={{ aspectRatio: "3 / 2" }}>
            <img
              src={src}
              alt={p.name}
              className="absolute inset-0 h-full w-full object-contain bg-gray-100"
              loading="lazy"
            />

            {showNew && (
              <div className="absolute left-2 top-2 rounded-md bg-black px-2 py-1 text-xs text-white">
                Nyhet
              </div>
            )}

            <span
              className="absolute bottom-2 right-2 rounded-full border bg-white px-3 py-2 text-sm"
              aria-label="Favorit"
            >
              ♡
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{p.name}</div>
            <div className="truncate text-xs text-neutral-600">{p.sku}</div>
          </div>
          <div className="whitespace-nowrap text-sm font-medium">
            {formatSEK(p.price_cents)}
          </div>
        </div>
      </Link>

      <AddToCartMini
        product={{
          id: p.id,
          name: p.name,
          price_cents: p.price_cents,
          image_url: p.image_url ?? undefined,
          slug: p.slug,
        }}
      />
    </div>
  );
}