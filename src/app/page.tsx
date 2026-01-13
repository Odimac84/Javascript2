import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";

export default async function HomePage() {
  const products = await getProducts("");

  return (
    <main className="py-6">
      <section className="rounded-xl border bg-neutral-50 p-4">
        <div className="aspect-[16/9] w-full rounded-lg border bg-white" />
        <h1 className="mt-4 text-xl font-semibold">Lorem ipsum dolor</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit…
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-semibold">Populära produkter</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Totalt visas 8 dynamiskt genererade produktkort.
        </p>

        <div className="mt-4 space-y-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
