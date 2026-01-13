import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function getIdFromUrl(req: Request) {
  const url = new URL(req.url);
  // /api/orders/1  -> ["", "api", "orders", "1"]
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts.at(-1) ?? "";
  const raw = last.trim();

  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function GET(req: Request) {
  const id = getIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const order = db
    .prepare(
      `
      SELECT
        id, status, currency, total_cents, created_at,
        customer_first_name, customer_last_name, customer_email,
        shipping_street, shipping_postal_code, shipping_city, shipping_country,
        newsletter_opt_in
      FROM orders
      WHERE id = ?
      `
    )
    .get(id);

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = db
    .prepare(
      `
      SELECT
        id, product_id, product_name, unit_price_cents,
        quantity, line_total_cents
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
      `
    )
    .all(id);

  return NextResponse.json({ order, items });
}
