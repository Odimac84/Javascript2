import "server-only";
import { db } from "@/lib/db";

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Genererar en unik slug för en tabell baserat på namn.
 * 
 */
export function generateUniqueSlug(
  table: "products" | "categories",
  name: string,
  excludeId?: number
): string {
  const base = slugify(name);
  let slug = base;
  let counter = 2;

  const stmt = db.prepare(`
    SELECT 1
    FROM ${table}
    WHERE slug = ?
    ${excludeId ? "AND id != ?" : ""}
    LIMIT 1
  `);

  while (true) {
    const exists = excludeId ? stmt.get(slug, excludeId) : stmt.get(slug);
    if (!exists) return slug;

    slug = `${base}-${counter}`;
    counter++;
  }
}
