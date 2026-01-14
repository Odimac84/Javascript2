import Link from "next/link";
import Image from "next/image";
import { formatSEK, type Product } from "@/lib/api";
import { normalizeImageUrl } from "@/lib/images";

function isNew(publishedAt?: string) {
  if (!publishedAt) return false;
  const published = new Date(publishedAt).getTime();
  const now = Date.now();
  const diffDays = (now - published) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

export default function ProductCard({
  p,
}: {
  p: Product & { image_url?: string };
}) {
  const showNew = isNew(p.published_at);

  return (
    <Link href={`/products/${p.slug}`} className="block rounded-xl border bg-white p-3">
      {/* 🔒 FIXED IMAGE BOX */}
      <div
  style={{ height: 160 }}
  className="relative overflow-hidden rounded-lg border"
>
  <Image
    src={normalizeImageUrl(p.image_url)}
    alt={p.name}
    fill
    unoptimized
    className="object-cover"
    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
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

      {/* INFO */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{p.name}</div>
          <div className="truncate text-xs text-neutral-600">{p.sku}</div>
        </div>
        <div className="whitespace-nowrap text-sm font-medium">{formatSEK(p.price_cents)}</div>
      </div>
    </Link>
  );
}
