import "server-only";
import { db } from "@/lib/db";

/**
 * Sätter exakt vilka categories en produkt ska ha.
 * Den tar en lista av category IDs och ersätter allt tidigare.
 */
export function setProductCategories(productId: number, categoryIds: number[]) {
  const run = db.transaction(() => {
    db.prepare("DELETE FROM product_categories WHERE product_id = ?").run(productId);

    const insert = db.prepare(`
      INSERT OR IGNORE INTO product_categories (product_id, category_id)
      VALUES (?, ?)
    `);

    for (const categoryId of categoryIds) {
      insert.run(productId, categoryId);
    }
  });

  run();
}

/** Hämtar categories (id, name, slug) för en produkt */
export function getCategoriesForProduct(productId: number) {
  return db.prepare(`
    SELECT c.id, c.name, c.slug
    FROM product_categories pc
    JOIN categories c ON c.id = pc.category_id
    WHERE pc.product_id = ?
    ORDER BY c.name ASC
  `).all(productId);
}
