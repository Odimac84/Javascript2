import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name: z.string().min(1),
});

const PatchSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1),
});

export async function GET() {
  const rows = db
    .prepare("SELECT id, name, slug, created_at FROM categories ORDER BY id DESC")
    .all();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const slug = generateUniqueSlug("categories", name);

  const info = db
    .prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
    .run(name, slug);

  const category = db
    .prepare("SELECT id, name, slug, created_at FROM categories WHERE id = ?")
    .get(info.lastInsertRowid);

  return NextResponse.json(category, { status: 201 });
}

export async function PATCH(req: Request) {
  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = parsed.data;
  const name = parsed.data.name.trim();

  const exists = db.prepare("SELECT id FROM categories WHERE id = ?").get(id);
  if (!exists) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const slug = generateUniqueSlug("categories", name, id);

  db.prepare(`
    UPDATE categories
    SET name = ?, slug = ?
    WHERE id = ?
  `).run(name, slug, id);

  const updated = db
    .prepare("SELECT id, name, slug, created_at FROM categories WHERE id = ?")
    .get(id);

  return NextResponse.json(updated);
}
