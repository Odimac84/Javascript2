export type Product = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  in_stock: boolean | number;
  active: boolean | number;
  published_at: string;
  categories: { id: number; name: string; slug: string }[];
};

export async function getProducts(query = ""): Promise<Product[]> {
  const res = await fetch(`http://localhost:3000/api/products${query}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export function formatSEK(cents: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
