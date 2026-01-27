import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const zBool = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(s)) return true;
    if (["false", "0", "no", "off"].includes(s)) return false;
  }
  return v;
}, z.boolean());

const CreateOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
  }),
  address: z.object({
    street: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1).optional().default("SE"),
  }),
  newsletterOptIn: zBool.optional().default(false),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        qty: z.coerce.number().int().positive(),
      })
    )
    .min(1),
});

export async function GET() {
  const rows = db
    .prepare(
      `
      SELECT
        id,
        customer_id,
        status,
        currency,
        total_cents,
        created_at,
        customer_first_name,
        customer_last_name,
        customer_email
      FROM orders
      ORDER BY id DESC
      `
    )
    .all();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const parsed = CreateOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { customer, address, newsletterOptIn, items } = parsed.data;

  const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));
  const placeholders = uniqueIds.map(() => "?").join(",");

  const products = db
    .prepare(
      `
      SELECT id, name, price_cents, active, in_stock
      FROM products
      WHERE id IN (${placeholders})
      `
    )
    .all(...uniqueIds) as Array<{
    id: number;
    name: string;
    price_cents: number;
    active: number;
    in_stock: number;
  }>;

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const it of items) {
    const p = productMap.get(it.productId);
    if (!p) {
      return NextResponse.json(
        { error: `Product not found: ${it.productId}` },
        { status: 404 }
      );
    }
    if (p.active !== 1) {
      return NextResponse.json(
        { error: `Product is inactive: ${it.productId}` },
        { status: 400 }
      );
    }
  }

  const computedItems = items.map((it) => {
    const p = productMap.get(it.productId)!;
    const unit = p.price_cents;
    const line = unit * it.qty;
    return {
      productId: p.id,
      productName: p.name,
      unitPriceCents: unit,
      qty: it.qty,
      lineTotalCents: line,
    };
  });

  const totalCents = computedItems.reduce((sum, it) => sum + it.lineTotalCents, 0);

  const create = db.transaction(() => {
    const email = customer.email.trim().toLowerCase();
    const fullName = `${customer.firstName.trim()} ${customer.lastName.trim()}`.trim();

    const existing = db
      .prepare(`SELECT id FROM customers WHERE email = ?`)
      .get(email) as { id: number } | undefined;

    let customerId: number;

    if (existing) {
      customerId = existing.id;
      db.prepare(`UPDATE customers SET name = ? WHERE id = ?`).run(fullName || null, customerId);
    } else {
      const info = db
        .prepare(`INSERT INTO customers (email, name) VALUES (?, ?)`)
        .run(email, fullName || null);
      customerId = Number(info.lastInsertRowid);
    }

    const orderInfo = db
      .prepare(
        `
        INSERT INTO orders (
          customer_id,
          status, currency, total_cents,
          customer_first_name, customer_last_name, customer_email,
          shipping_street, shipping_postal_code, shipping_city, shipping_country,
          newsletter_opt_in
        )
        VALUES (
          ?,
          'pending', 'SEK', ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?
        )
        `
      )
      .run(
        customerId,
        totalCents,
        customer.firstName.trim(),
        customer.lastName.trim(),
        email,
        address.street.trim(),
        address.postalCode.trim(),
        address.city.trim(),
        (address.country ?? "SE").trim().toUpperCase(),
        newsletterOptIn ? 1 : 0
      );

    const orderId = Number(orderInfo.lastInsertRowid);

    // 4) Insert order items
    const insertItem = db.prepare(
      `
      INSERT INTO order_items (
        order_id, product_id, product_name, unit_price_cents,
        quantity, line_total_cents
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `
    );

    for (const it of computedItems) {
      insertItem.run(
        orderId,
        it.productId,
        it.productName,
        it.unitPriceCents,
        it.qty,
        it.lineTotalCents
      );
    }

    return orderId;
  });

  const orderId = create();

  const order = db
    .prepare(
      `
      SELECT
        id, customer_id, status, currency, total_cents, created_at,
        customer_first_name, customer_last_name, customer_email,
        shipping_street, shipping_postal_code, shipping_city, shipping_country,
        newsletter_opt_in
      FROM orders
      WHERE id = ?
      `
    )
    .get(orderId);

  const orderItems = db
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
    .all(orderId);

  return NextResponse.json({ order, items: orderItems }, { status: 201 });
}