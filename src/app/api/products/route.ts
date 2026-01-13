import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import {
  getCategoriesForProduct,
  setProductCategories,
} from "@/lib/repo/productCategories.repo";

export const runtime = "nodejs";

// Tillåt att man kan skapa produkter som publiceras senare.
// Format: "YYYY-MM-DD HH:MM:SS" (SQLite-friendly) eller ISO-sträng.
// Vi normaliserar till en SQLite-string.
const CreateProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().nonnegative(),
  inStock: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  categoryIds: z.array(z.coerce.number().int().positive()).optional().default([]),

  // NYTT:
  // kan vara t.ex. "2026-01-13 12:00:00" eller ISO "2026-01-13T12:00:00.000Z"
  publishedAt: z.string().optional(),
});

function toSqliteDateTime(input?: string) {
  if (!input) return null;

  // Om användaren skickar "YYYY-MM-DD HH:MM:SS" -> använd direkt
  const looksSqlite = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input.trim());
  if (looksSqlite) return input.trim();

  // Annars försök tolka som ISO/date och konvertera till "YYYY-MM-DD HH:MM:SS" (UTC)
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim();
  const categorySlug = url.searchParams.get("category")?.trim();

  const where: string[] = [];
  const params: any[] = [];

  // ✅ Viktigt: bara publicerade produkter (framtida produkter syns inte)
  where.push("p.published_at <= datetime('now')");

  if (search) {
    where.push("p.name LIKE ?");
    params.push(`%${search}%`);
  }

  if (categorySlug) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM product_categories pc
        JOIN categories c ON c.id = pc.category_id
        WHERE pc.product_id = p.id AND c.slug = ?
      )
    `);
    params.push(categorySlug);
  }

  const sql = `
    SELECT
      p.id, p.sku, p.name, p.slug, p.description,
      p.price_cents, p.in_stock, p.active,
      p.published_at, p.created_at
    FROM products p
    WHERE ${where.join(" AND ")}
    ORDER BY p.id DESC
  `;

  const rows = db.prepare(sql).all(...params) as any[];

  const normalized = rows.map((p) => ({
    ...p,
    in_stock: p.in_stock === 1,
    active: p.active === 1,
    categories: getCategoriesForProduct(p.id),
  }));

  return NextResponse.json(normalized);
}

export async function POST(req: Request) {
  const parsed = CreateProductSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sku = parsed.data.sku.trim();
  const name = parsed.data.name.trim();
  const slug = generateUniqueSlug("products", name);

  // publishedAt: om null => default i DB (datetime('now'))
  const publishedAt = toSqliteDateTime(parsed.data.publishedAt);

  // Om användaren skickade publishedAt men det var ogiltigt -> 400
  if (parsed.data.publishedAt && !publishedAt) {
    return NextResponse.json(
      { error: "Invalid publishedAt. Use ISO date or 'YYYY-MM-DD HH:MM:SS'." },
      { status: 400 }
    );
  }

  try {
    const info = db
      .prepare(
        `
        INSERT INTO products (
          sku, name, slug, description,
          price_cents, in_stock, active,
          published_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
        `
      )
      .run(
        sku,
        name,
        slug,
        parsed.data.description?.trim() || null,
        parsed.data.priceCents,
        parsed.data.inStock === false ? 0 : 1,
        parsed.data.active === false ? 0 : 1,
        publishedAt
      );

    const productId = Number(info.lastInsertRowid);

    // Koppla categories (om skickade)
    setProductCategories(productId, parsed.data.categoryIds);

    const product = db
      .prepare(
        `
        SELECT
          id, sku, name, slug, description,
          price_cents, in_stock, active,
          published_at, created_at
        FROM products
        WHERE id = ?
        `
      )
      .get(productId) as any;

    return NextResponse.json(
      {
        ...product,
        in_stock: product.in_stock === 1,
        active: product.active === 1,
        categories: getCategoriesForProduct(productId),
      },
      { status: 201 }
    );
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("UNIQUE") && (msg.includes("products.sku") || msg.includes("sku"))) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create product" }, { status: 400 });
  }
}
