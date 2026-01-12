import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
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
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim();
  const categorySlug = url.searchParams.get("category")?.trim();

  const where: string[] = [];
  const params: any[] = [];

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
      p.price_cents, p.in_stock, p.active, p.created_at
    FROM products p
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
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

  try {
    const info = db
      .prepare(
        `
        INSERT INTO products (sku, name, slug, description, price_cents, in_stock, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        sku,
        name,
        slug,
        parsed.data.description?.trim() || null,
        parsed.data.priceCents,
        parsed.data.inStock === false ? 0 : 1,
        parsed.data.active === false ? 0 : 1
      );

    const productId = Number(info.lastInsertRowid);

    // Koppla categories (om skickade)
    setProductCategories(productId, parsed.data.categoryIds);

    const product = db
      .prepare(
        `
        SELECT id, sku, name, slug, description, price_cents, in_stock, active, created_at
        FROM products
        WHERE id = ?
        `
      )
      .get(productId);

    return NextResponse.json(
      {
        ...product,
        in_stock: (product as any).in_stock === 1,
        active: (product as any).active === 1,
        categories: getCategoriesForProduct(productId),
      },
      { status: 201 }
    );
  } catch (e: any) {
    // Vanligaste: SKU UNIQUE
    const msg = String(e?.message || "");
    if (msg.includes("UNIQUE") && (msg.includes("products.sku") || msg.includes("sku"))) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create product" }, { status: 400 });
  }
}
