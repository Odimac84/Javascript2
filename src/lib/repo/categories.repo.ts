import "server-only";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";

export function createCategory(name: string) {
  const cleanName = name.trim();
  const slug = generateUniqueSlug("categories", cleanName);

  const info = db
    .prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
    .run(cleanName, slug);

  return db
    .prepare("SELECT id, name, slug, created_at FROM categories WHERE id = ?")
    .get(info.lastInsertRowid);
}
