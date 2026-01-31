import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function parseId(raw: string) {
  const s = String(raw ?? "").trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

type Ctx = { params: { id: string } } | { params: Promise<{ id: string }> };

async function getIdFromCtx(ctx: Ctx) {
  const p = await (ctx as any).params; 
  const id = parseId(p?.id);
  return id;
}

export async function GET(_req: Request, ctx: Ctx) {
  const id = await getIdFromCtx(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const row = db
    .prepare(
      `
      SELECT
        id, sku, name, slug, description,
        price_cents, active, in_stock,
        image_url, published_at, created_at
      FROM products
      WHERE id = ?
      `
    )
    .get(id);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = await getIdFromCtx(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    db.prepare(`DELETE FROM product_categories WHERE product_id = ?`).run(id);
  } catch {
  }

  const info = db.prepare(`DELETE FROM products WHERE id = ?`).run(id);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
