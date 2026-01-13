import Database from "better-sqlite3";
import { PLACEHOLDER_IMAGE } from "./constants";

const db = new Database("database.sqlite");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// helpers
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toSqliteDateTime(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(base: string, used: Set<string>) {
  let slug = slugify(base);
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let i = 2;
  while (used.has(`${slug}-${i}`)) i++;
  const finalSlug = `${slug}-${i}`;
  used.add(finalSlug);
  return finalSlug;
}

// deterministic RNG so seed is stable
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]) {
  return arr[Math.floor(rng() * arr.length)];
}

function int(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

db.transaction(() => {
  console.log("🌱 Seeding database (recreate + 20 products + placeholder images)...");

  db.exec(`
    DROP TABLE IF EXISTS product_categories;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS categories;
  `);

  db.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      in_stock INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE product_categories (
      product_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (product_id, category_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // categories
  const insertCategory = db.prepare(`INSERT INTO categories (name, slug) VALUES (?, ?)`);
  const categories = [
    { name: "Nyheter", slug: "nyheter" },
    { name: "Topplistan", slug: "topplistan" },
    { name: "Rea", slug: "rea" },
    { name: "Kampanjer", slug: "kampanjer" },
  ];

  const categoryIds: Record<string, number> = {};
  for (const c of categories) {
    const info = insertCategory.run(c.name, c.slug);
    categoryIds[c.slug] = Number(info.lastInsertRowid);
  }

  const rng = mulberry32(1337);

  const brands = ["Levis", "Nike", "Adidas", "Weekday", "Acne", "Carhartt", "Filippa K"];
  const colors = ["Svart", "Vit", "Grå", "Blå", "Grön", "Röd", "Beige"];
  const types = ["T-shirt", "Hoodie", "Sweatshirt", "Jeans", "Jacka", "Keps", "Skjorta"];
  const materials = ["Bomull", "Denim", "Ullmix", "Polyester", "Ekologisk bomull"];

  const usedSlugs = new Set<string>();

  const insertProduct = db.prepare(`
    INSERT INTO products (
      sku, name, slug, description,
      image_url,
      price_cents, in_stock, active, published_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPC = db.prepare(`
    INSERT INTO product_categories (product_id, category_id)
    VALUES (?, ?)
  `);

  const now = new Date();

  const publishedOffsetsDays = [0, 1, 2, 3, 5, 6, 7, 10, 14, 21, 30, 45];

  for (let i = 1; i <= 20; i++) {
    const color = pick(rng, colors);
    const type = pick(rng, types);
    const brand = pick(rng, brands);
    const material = pick(rng, materials);

    const name = `${color} ${type}`;
    const slug = uniqueSlug(name, usedSlugs);

    const base =
      type === "T-shirt" ? 199 :
      type === "Hoodie" ? 499 :
      type === "Sweatshirt" ? 399 :
      type === "Jeans" ? 699 :
      type === "Jacka" ? 999 :
      type === "Keps" ? 199 :
      499;

    const price = base + int(rng, -50, 150);
    const priceCents = price * 100;

    // publicering: första 12 publicerade, resten blandat (framtid/äldre)
    let publishedAt: Date;
    if (i <= 12) {
      const daysAgo = publishedOffsetsDays[(i - 1) % publishedOffsetsDays.length];
      publishedAt = new Date(now);
      publishedAt.setDate(now.getDate() - daysAgo);
    } else {
      if (i % 2 === 0) {
        const daysForward = int(rng, 7, 365);
        publishedAt = new Date(now);
        publishedAt.setDate(now.getDate() + daysForward);
      } else {
        const daysAgo = int(rng, 8, 180);
        publishedAt = new Date(now);
        publishedAt.setDate(now.getDate() - daysAgo);
      }
    }

    const sku = `SKU-${String(i).padStart(3, "0")}`;
    const description = `${name} från ${brand}. Material: ${material}.`;

    const inStock = rng() < 0.9 ? 1 : 0;
    const active = rng() < 0.95 ? 1 : 0;

    const info = insertProduct.run(
      sku,
      name,
      slug,
      description,
      PLACEHOLDER_IMAGE, // ✅ all products get same image url
      priceCents,
      inStock,
      active,
      toSqliteDateTime(publishedAt)
    );

    const productId = Number(info.lastInsertRowid);

    // category rules
    const ageDays = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (ageDays >= 0 && ageDays <= 7) insertPC.run(productId, categoryIds["nyheter"]);
    if (i % 3 === 0) insertPC.run(productId, categoryIds["topplistan"]);
    if (i % 5 === 0) insertPC.run(productId, categoryIds["rea"]);
    if (i % 7 === 0) insertPC.run(productId, categoryIds["kampanjer"]);
  }

  console.log("✅ Seed complete: 4 categories, 20 products (placeholder images on all)");
})();

db.close();
