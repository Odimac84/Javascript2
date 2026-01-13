import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { getProducts } from "@/lib/api";

export default async function HomePage() {
  const products = await getProducts("");

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

      {/* 3 boxes (only lg+) */}
      <section className="mt-6 hidden gap-4 lg:grid lg:grid-cols-3">
        {["Lorem ipsum dolor", "Lorem ipsum dolor", "Lorem ipsum dolor"].map((t, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border"
          >
            <Image
              src={PLACEHOLDER_IMAGE}
              alt={t}
              width={600}
              height={400}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-md bg-white/90 px-3 py-2 text-sm font-medium">
                {t}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* PRODUCTS */}
      <section className="mt-8">
        <h2 className="text-base font-semibold">Populära produkter</h2>

        {/* outer border around all cards */}
        <div className="mt-4 rounded-xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p as any} />
            ))}
          </div>
        </div>

        {/* Spots: 2 cols at sm, 4 cols at lg */}
        <div className="pl-6 mt-8 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">🌍 <span>Gratis frakt och returer</span></div>
          <div className="flex items-center gap-2">✈️ <span>Expressfrakt</span></div>
          <div className="flex items-center gap-2">🛡️ <span>Säkra betalningar</span></div>
          <div className="flex items-center gap-2">🙂 <span>Nyheter varje dag</span></div>
        </div>
      </section>
    </main>
  );
}
