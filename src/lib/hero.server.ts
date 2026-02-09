import "server-only";
import { db } from "@/lib/db";

export type HeroRow = {
  id: 1;
  title: string;
  description: string;
  image_url: string;
};

export function getHero(): HeroRow | null {
  const row = db
    .prepare(`SELECT id, title, description, image_url FROM hero WHERE id = 1`)
    .get() as HeroRow | undefined;

  return row ?? null;
}