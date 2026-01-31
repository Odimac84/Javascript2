import Image from "next/image";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { formatSEK } from "@/lib/api";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/repo/products.repo";
import { normalizeImageUrl } from "@/lib/images";
import AddToCartButton from "@/components/AddToCartButton.client";

export const runtime = "nodejs";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = getProductBySlug(slug);
  if (!product) return notFound();

  const related = getRelatedProducts(product.id, 6);

  return (
    <main className="py-6">
      <h1 className="mb-4 text-xl font-semibold sm:hidden">{product.name}</h1>

      <section className="grid gap-6 sm:grid-cols-2">
        <div
          className="relative w-full overflow-hidden rounded-xl border bg-gray-100"
          style={{ aspectRatio: "3 / 2" }} 
        >
          <Image
            src={normalizeImageUrl(product.image_url)}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 600px"
            priority
          />
        </div>


        <div className="rounded-xl p-4">
          <h1 className="hidden text-xl font-semibold sm:block">
            {product.name}
          </h1>

          <p className="mt-2 text-sm text-neutral-600">
            {product.description || "Ingen beskrivning ännu."}
          </p>

          <div className="mt-4 text-lg font-semibold">
            {formatSEK(product.price_cents)}
          </div>

          <div className="mt-4">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price_cents: product.price_cents,
                image_url: product.image_url,
                slug: product.slug,
              }}
            />
          </div>

          {product.categories.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <div className="text-xs font-medium text-neutral-700">
                Kategorier
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.categories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full border px-3 py-1 text-xs"
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12 hidden sm:block">
        <h2 className="mb-4 text-center text-base font-semibold">
          Liknande produkter
        </h2>

        <div className="rounded-xl p-2">
          <div className="flex gap-3 overflow-x-auto">
            {related.slice(0, 3).map((p) => (
              <div key={p.id} className="w-[32%] flex-shrink-0">
                <ProductCard p={p as any} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}