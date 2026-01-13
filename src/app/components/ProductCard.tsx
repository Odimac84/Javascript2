import Link from "next/link";
import Image from "next/image";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { formatSEK, type Product } from "@/lib/api";

function isNew(publishedAt?: string) {
  if (!publishedAt) return false;
  const published = new Date(publishedAt).getTime();
  const now = Date.now();
  const diffDays = (now - published) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

export default function ProductCard({ p }: { p: Product & { image_url?: string } }) {
  const showNew = isNew(p.published_at);

  return (
    <Link href={`/products/${p.slug}`} className="block rounded-xl border p-3">
      <div className="relative">
        <Image
          src={p.image_url || PLACEHOLDER_IMAGE}
          alt={p.name}
          width={600}
          height={400}
          className="h-auto w-full rounded-lg border"
        />

        {showNew && (
          <div className="absolute left-2 top-2 rounded-md bg-black px-2 py-1 text-xs text-white">
            Nyhet
          </div>
        )}

        {/* Hjärtat gör inget (wireframe) */}
        <span
          className="absolute bottom-2 right-2 rounded-full border bg-white px-3 py-2 text-sm"
          aria-label="Favorit"
        >
          ♡
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{p.name}</div>
          <div className="text-xs text-neutral-600">{p.sku}</div>
        </div>
        <div className="text-sm font-medium">{formatSEK(p.price_cents)}</div>
      </div>
    </Link>
  );
}
