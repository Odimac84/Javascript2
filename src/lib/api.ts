import "server-only";
import { headers } from "next/headers";

export type Product = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  price_cents: number;
  in_stock: boolean;
  active: boolean;
  created_at: string;
  published_at?: string | null;
  image_url?: string | null;
  categories: { id: number; name: string; slug: string }[];
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");

  if (!host) return "http://localhost:3000";

  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${proto}://${host}`;
}

export async function getProducts(search: string) {
  const q = search.trim();

  const base = await getBaseUrl();
  const url = new URL(`${base}/api/products`);
  if (q) url.searchParams.set("search", q);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch products: ${res.status} ${res.statusText}\n${text}`
    );
  }

  return (await res.json()) as Product[];
}

export function formatSEK(cents: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
