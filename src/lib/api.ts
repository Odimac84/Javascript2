export type Category = {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
};

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

export function formatSEK(cents: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
