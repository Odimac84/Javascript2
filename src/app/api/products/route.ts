import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import {
  getCategoriesForProduct,
  setProductCategories,
} from "@/lib/repo/productCategories.repo";

export const runtime = "nodejs";

const CreateProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().nonnegative(),
  inStock: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  categoryIds: z.array(z.coerce.number().int().positive()).optional().default([]),
  publishedAt: z.string().optional(), // "YYYY-MM-DD HH:MM:SS" eller ISO
});

function toSqliteDateTime(input?: string) {
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim();
  const categorySlug = url.searchParams.get("category")?.trim();

  const where: string[] = [];
  const params: any[] = [];

  // ✅ only publicerade
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
      p.image_url,
      p.price_cents, p.in_stock, p.active,
      p.published_at, p.created_at
    FROM products p
    WHERE ${where.join(" AND ")}
    ORDER BY p.id DESC
  `;

  const rows = db.prepare(sql).all(...params) as any[];

  const normalized = rows.map((p) => ({
    ...p,
    image_url: p.image_url || PLACEHOLDER_IMAGE,
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

  const publishedAt = toSqliteDateTime(parsed.data.publishedAt);
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
          image_url,
          price_cents, in_stock, active,
          published_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
        `
      )
      .run(
        sku,
        name,
        slug,
        parsed.data.description?.trim() || null,
        PLACEHOLDER_IMAGE,
        parsed.data.priceCents,
        parsed.data.inStock === false ? 0 : 1,
        parsed.data.active === false ? 0 : 1,
        publishedAt
      );

    const productId = Number(info.lastInsertRowid);

    setProductCategories(productId, parsed.data.categoryIds);

    const product = db
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
      .get(productId) as any;

    return NextResponse.json(
      {
        ...product,
        image_url: product.image_url || PLACEHOLDER_IMAGE,
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
