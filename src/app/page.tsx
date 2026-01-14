import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { getProducts } from "@/lib/api";
import { db } from "@/lib/db";

type SpotRow = {
  id: number;
  title: string;
  image_url: string;
};

function getHomepageSpots(limit = 3) {
  const rows = db
    .prepare(
      `
      SELECT id, title, image_url
      FROM spots
      WHERE active = 1
      ORDER BY sort_order ASC, id ASC
      LIMIT ?
      `
    )
    .all(limit) as SpotRow[];

  const spots = rows.map((r) => ({
    id: r.id,
    title: r.title,
    image_url: r.image_url || PLACEHOLDER_IMAGE,
  }));

  const fallbackTitles = ["Lorem ipsum dolor", "Lorem ipsum dolor", "Lorem ipsum dolor"];

  while (spots.length < limit) {
    const i = spots.length;
    spots.push({
      id: -1 - i,
      title: fallbackTitles[i] ?? "Lorem ipsum",
      image_url: PLACEHOLDER_IMAGE,
    });
  }

  return spots;
}

export const runtime = "nodejs";

export default async function HomePage() {
  const products = await getProducts("");
  const spots = getHomepageSpots(3);

  return (
    <main className="py-6">
      {/* HERO */}
      <section className="rounded-xl border bg-neutral-50 p-4">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-xl font-semibold">Lorem ipsum dolor</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
            </p>
          </div>

          <Image
            src={PLACEHOLDER_IMAGE}
            alt="Hero"
            width={600}
            height={400}
            className="w-full rounded-lg border"
          />
        </div>
      </section>

      {/* SPOTS – endast ≥640px, alltid 3 i rad */}
      <section className="mt-10 hidden sm:block">
        <div className="mx-auto flex max-w-6xl flex-nowrap justify-center gap-4">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="relative w-1/3 min-w-[200px] overflow-hidden rounded-xl border bg-white"
            >
              <div className="relative aspect-[3/2]">
                <img
                  src={spot.image_url}
                  alt={spot.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-md bg-white/90 px-4 py-2 text-sm font-semibold">
                  {spot.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mt-8">
        <div className="mt-4 rounded-xl">
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p as any} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
