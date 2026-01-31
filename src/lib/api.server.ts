import "server-only";
import { headers } from "next/headers";
import type { Product, Category } from "@/lib/api";

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
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}\n${text}`);
  }

  return (await res.json()) as Product[];
}

export async function getAllProducts() {
  const base = await getBaseUrl();
  const url = new URL(`${base}/api/products`);
  url.searchParams.set("all", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch all products: ${res.status} ${res.statusText}\n${text}`);
  }

  return (await res.json()) as Product[];
}

export async function getCategories() {
  const base = await getBaseUrl();
  const url = new URL(`${base}/api/categories`);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}\n${text}`);
  }

  return (await res.json()) as Category[];
}
