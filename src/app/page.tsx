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
        <Image
          src={PLACEHOLDER_IMAGE}
          alt="Hero"
          width={600}
          height={400}
          className="w-full rounded-lg border"
        />
        <h1 className="mt-4 text-xl font-semibold">Lorem ipsum dolor</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit…
        </p>
      </section>

      {/* PRODUKTER */}
      <section className="mt-6">
        {/* outer border around all cards */}
        <div className="mt-4 rounded-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p as any} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
