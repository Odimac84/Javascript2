import "server-only";
import { db } from "@/lib/db";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

export type SpotRow = {
  id: number;
  title: string;
  image_url: string;
  sort_order: number;
  active: number; // 0/1
  created_at: string;
};

export type Spot = {
  id: number | null;
  title: string;
  image_url: string;
};

const FALLBACK_TITLES = ["Lorem ipsum dolor", "Lorem ipsum dolor", "Lorem ipsum dolor"];

export function getHomepageSpots(limit = 3): Spot[] {
  const rows = db
    .prepare(
      `
      SELECT id, title, image_url, sort_order, active, created_at
      FROM spots
      WHERE active = 1
      ORDER BY sort_order ASC, id ASC
      LIMIT ?
      `
    )
    .all(limit) as SpotRow[];

  const spots: Spot[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    image_url: r.image_url || PLACEHOLDER_IMAGE,
  }));

  // Fyll upp med placeholders om det saknas spots i DB
  while (spots.length < limit) {
    const i = spots.length;
    spots.push({
      id: null,
      title: FALLBACK_TITLES[i] ?? "Lorem ipsum",
      image_url: PLACEHOLDER_IMAGE,
    });
  }

  return spots;
}
