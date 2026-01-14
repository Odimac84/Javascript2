import "server-only";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

export type ProductRow = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  price_cents: number;
  in_stock: number; // 0/1
  active: number; // 0/1
  published_at: string; // "YYYY-MM-DD HH:MM:SS"
  created_at: string;
};

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
};

export type ProductWithCategories = Omit<ProductRow, "in_stock" | "active"> & {
  in_stock: boolean;
  active: boolean;
  categories: CategoryRow[];
};

/**
 * Helpers
 */
function normalize(row: ProductRow): ProductWithCategories {
  return {
    ...row,
    image_url: row.image_url || PLACEHOLDER_IMAGE,
    in_stock: row.in_stock === 1,
    active: row.active === 1,
    categories: getCategoriesForProduct(row.id),
  };
}

export function toSqliteDateTime(input?: string): string | null {
  if (!input) return null;

  const s = input.trim();
  const looksSqlite = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s);
  if (looksSqlite) return s;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/**
 * Categories för en produkt
 */
export function getCategoriesForProduct(productId: number): CategoryRow[] {
  return db
    .prepare(
      `
      SELECT c.id, c.name, c.slug
      FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id = ?
      ORDER BY c.name ASC
      `
    )
    .all(productId) as CategoryRow[];
}

/**
 * CREAT
 */
export function createProduct(data: {
  sku: string;
  name: string;
  description?: string | null;
  priceCents: number;
  inStock?: boolean;
  active?: boolean;
  imageUrl?: string | null;
  publishedAt?: string | null; 
}) {
  const cleanName = data.name.trim();
  const slug = generateUniqueSlug("products", cleanName);

  const imageUrl = data.imageUrl?.trim() || PLACEHOLDER_IMAGE;

  const published = toSqliteDateTime(data.publishedAt ?? undefined);
  const publishedParam = data.publishedAt ? published : null;

  const info = db
    .prepare(
      `
      INSERT INTO products (
        sku, name, slug, description,
        image_url,
        price_cents, in_stock, active,
        published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
      `
    )
    .run(
      data.sku.trim(),
      cleanName,
      slug,
      data.description ?? null,
      imageUrl,
      data.priceCents,
      data.inStock === false ? 0 : 1,
      data.active === false ? 0 : 1,
      publishedParam
    );

  const row = db
    .prepare(
      `
      SELECT
        id, sku, name, slug, description,
        image_url,
        price_cents, in_stock, active,
        published_at, created_at
      FROM products
      WHERE id = ?
      `
    )
    .get(info.lastInsertRowid) as ProductRow | undefined;

  return row ? normalize(row) : null;
}

/**
 * UPDATE NAME
 */
export function updateProductName(productId: number, newName: string) {
  const cleanName = newName.trim();
  const newSlug = generateUniqueSlug("products", cleanName, productId);

  db.prepare(
    `
    UPDATE products
    SET name = ?, slug = ?
    WHERE id = ?
    `
  ).run(cleanName, newSlug, productId);

  const row = db
    .prepare(
      `
      SELECT
        id, sku, name, slug, description,
        image_url,
        price_cents, in_stock, active,
        published_at, created_at
      FROM products
      WHERE id = ?
      `
    )
    .get(productId) as ProductRow | undefined;

  return row ? normalize(row) : null;
}

/**
 * Hämta en produkt via slug (för produktsidan)
 */
export function getProductBySlug(slug: string, opts?: { all?: boolean }) {
  const all = opts?.all === true;

  const row = db
    .prepare(
      `
      SELECT
        id, sku, name, slug, description,
        image_url,
        price_cents, in_stock, active,
        published_at, created_at
      FROM products
      WHERE slug = ?
      ${all ? "" : "AND published_at <= datetime('now')"}
      LIMIT 1
      `
    )
    .get(slug) as ProductRow | undefined;

  return row ? normalize(row) : null;
}

/**
 * Liknande produkter:
 */
export function getRelatedProducts(currentProductId: number, limit = 4) {
  const rows = db
    .prepare(
      `
      SELECT
        p.id, p.sku, p.name, p.slug, p.description,
        p.image_url,
        p.price_cents, p.in_stock, p.active,
        p.published_at, p.created_at
      FROM products p
      WHERE p.id != ?
        AND p.published_at <= datetime('now')
        AND EXISTS (
          SELECT 1
          FROM product_categories pc1
          JOIN product_categories pc2 ON pc2.category_id = pc1.category_id
          WHERE pc1.product_id = ?
            AND pc2.product_id = p.id
        )
      ORDER BY p.id DESC
      LIMIT ?
      `
    )
    .all(currentProductId, currentProductId, limit) as ProductRow[];

  if (rows.length > 0) return rows.map(normalize);

  const fallback = db
    .prepare(
      `
      SELECT
        p.id, p.sku, p.name, p.slug, p.description,
        p.image_url,
        p.price_cents, p.in_stock, p.active,
        p.published_at, p.created_at
      FROM products p
      WHERE p.id != ?
        AND p.published_at <= datetime('now')
      ORDER BY p.id DESC
      LIMIT ?
      `
    )
    .all(currentProductId, limit) as ProductRow[];

  return fallback.map(normalize);
}
