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

type ProductRow = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  price_cents: number;
  in_stock: number; // 0/1
  active: number; // 0/1
  published_at: string;
  created_at: string;
};

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  categoryIds: z.array(z.coerce.number().int().positive()).optional(),
  imageUrl: z.string().url().optional(),
  publishedAt: z.string().optional(), // ISO eller "YYYY-MM-DD HH:MM:SS"
});

function toSqliteDateTime(input?: string): string | null {
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

function normalize(row: ProductRow) {
  return {
    ...row,
    image_url: row.image_url || PLACEHOLDER_IMAGE,
    in_stock: row.in_stock === 1,
    active: row.active === 1,
    categories: getCategoriesForProduct(row.id),
  };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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
    .get(id) as ProductRow | undefined;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(normalize(row));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const current = db
    .prepare("SELECT id, name FROM products WHERE id = ?")
    .get(id) as { id: number; name: string } | undefined;

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // name -> unique slug
  let newName: string | undefined;
  let newSlug: string | undefined;

  if (parsed.data.name !== undefined) {
    newName = parsed.data.name.trim();
    newSlug = generateUniqueSlug("products", newName, id);
  }

  const publishedAt = toSqliteDateTime(parsed.data.publishedAt);
  if (parsed.data.publishedAt && !publishedAt) {
    return NextResponse.json(
      { error: "Invalid publishedAt. Use ISO date or 'YYYY-MM-DD HH:MM:SS'." },
      { status: 400 }
    );
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (newName !== undefined) {
    fields.push("name = ?");
    values.push(newName);
  }
  if (newSlug !== undefined) {
    fields.push("slug = ?");
    values.push(newSlug);
  }
  if (parsed.data.description !== undefined) {
    fields.push("description = ?");
    values.push(parsed.data.description.trim() || null);
  }
  if (parsed.data.priceCents !== undefined) {
    fields.push("price_cents = ?");
    values.push(parsed.data.priceCents);
  }
  if (parsed.data.inStock !== undefined) {
    fields.push("in_stock = ?");
    values.push(parsed.data.inStock ? 1 : 0);
  }
  if (parsed.data.active !== undefined) {
    fields.push("active = ?");
    values.push(parsed.data.active ? 1 : 0);
  }
  if (parsed.data.imageUrl !== undefined) {
    fields.push("image_url = ?");
    values.push(parsed.data.imageUrl.trim() || PLACEHOLDER_IMAGE);
  }
  if (publishedAt !== null) {
    fields.push("published_at = ?");
    values.push(publishedAt);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  // allow [] to clear categories
  if (parsed.data.categoryIds !== undefined) {
    setProductCategories(id, parsed.data.categoryIds);
  }

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
    .get(id) as ProductRow | undefined;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(normalize(row));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  if (info.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
