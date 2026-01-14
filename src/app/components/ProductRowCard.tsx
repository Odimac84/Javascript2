import Link from "next/link";
import { formatSEK, type Product } from "@/lib/api";

export default function ProductRowCard({ p }: { p: Product }) {
  return (
    <Link
      href={`/products/${p.slug}`}
      className="flex min-h-[72px] items-center justify-between rounded-xl border bg-white px-4 py-3"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{p.name}</div>
        <div className="truncate text-xs text-neutral-600">{p.sku}</div>
      </div>

      <div className="whitespace-nowrap text-sm font-medium">
        {formatSEK(p.price_cents)}
      </div>
    </Link>
  );
}
