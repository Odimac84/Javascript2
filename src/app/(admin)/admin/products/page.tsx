import Link from "next/link";
import { getAllProducts } from "@/lib/api.server";
import ProductsTable from "./products-table.client";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <main className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Produkter</h1>

        <Link
          href="/admin/products/new"
          className="h-9 rounded-md border bg-white px-4 text-sm font-medium hover:bg-gray-50"
        >
          Ny produkt
        </Link>
      </div>

      <div className="mt-4">
        <ProductsTable initialProducts={products} />
      </div>
    </main>
  );
}
