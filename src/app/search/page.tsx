import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";

export const runtime = "nodejs";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const products = await getProducts(query);

  return (
    <main className="py-6">
      <div className="mb-4">
        <h1 className="text-base font-semibold">
          Hittade {products.length} produkter
        </h1>

        {query && (
          <p className="mt-1 text-sm text-neutral-600">
            Sökning: <span className="font-medium text-neutral-900">{query}</span>
          </p>
        )}
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} p={p as any} />
        ))}
      </section>
    </main>
  );
}
