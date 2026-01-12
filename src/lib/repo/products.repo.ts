import "server-only";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";

export function createProduct(data: {
  sku: string;
  name: string;
  description?: string | null;
  priceCents: number;
  inStock?: boolean;
  active?: boolean;
}) {
  const cleanName = data.name.trim();

  // Gör slug unik baserat på namn
  const slug = generateUniqueSlug("products", cleanName);

  const info = db
    .prepare(`
      INSERT INTO products (sku, name, slug, description, price_cents, in_stock, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.sku.trim(),
      cleanName,
      slug,
      data.description ?? null,
      data.priceCents,
      data.inStock === false ? 0 : 1,
      data.active === false ? 0 : 1
    );

  return db
    .prepare("SELECT id, sku, name, slug, price_cents, in_stock, active, created_at FROM products WHERE id = ?")
    .get(info.lastInsertRowid);
}

export function updateProductName(productId: number, newName: string) {
  const cleanName = newName.trim();
  const newSlug = generateUniqueSlug("products", cleanName, productId);

  db.prepare(`
    UPDATE products
    SET name = ?, slug = ?
    WHERE id = ?
  `).run(cleanName, newSlug, productId);

  return db
    .prepare("SELECT id, sku, name, slug FROM products WHERE id = ?")
    .get(productId);
}