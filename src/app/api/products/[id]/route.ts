import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import {
  getCategoriesForProduct,
  setProductCategories,
} from "@/lib/repo/productCategories.repo";

export const runtime = "nodejs";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  categoryIds: z.array(z.coerce.number().int().positive()).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = db
    .prepare(
      `
      SELECT id, sku, name, slug, description, price_cents, in_stock, active, created_at
      FROM products
      WHERE id = ?
      `
    )
    .get(id);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...row,
    in_stock: (row as any).in_stock === 1,
    active: (row as any).active === 1,
    categories: getCategoriesForProduct(id),
  });
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

  // Om name ändras: generera unik slug
  let newName: string | undefined;
  let newSlug: string | undefined;

  if (parsed.data.name !== undefined) {
    newName = parsed.data.name.trim();
    newSlug = generateUniqueSlug("products", newName, id);
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

  // Uppdatera product-fält om något skickats
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  // Uppdatera categories om categoryIds skickats
  if (parsed.data.categoryIds) {
    setProductCategories(id, parsed.data.categoryIds);
  }

  const updated = db
    .prepare(
      `
      SELECT id, sku, name, slug, description, price_cents, in_stock, active, created_at
      FROM products
      WHERE id = ?
      `
    )
    .get(id);

  return NextResponse.json({
    ...updated,
    in_stock: (updated as any).in_stock === 1,
    active: (updated as any).active === 1,
    categories: getCategoriesForProduct(id),
  });
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
