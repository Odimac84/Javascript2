"use client";

import { useState } from "react";
import { formatSEK, type Product } from "@/lib/api";

export default function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(id: number) {
    setError(null);

    const ok = confirm("Vill du verkligen ta bort produkten?");
    if (!ok) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Kunde inte ta bort produkten.");
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Kunde inte ta bort produkten.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="inline-block min-w-[520px] max-w-3xl overflow-hidden border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-3 py-2 text-left font-medium">Namn</th>
              <th className="border px-3 py-2 text-left font-medium">SKU</th>
              <th className="border px-3 py-2 text-left font-medium">Pris</th>
              <th className="border px-2 py-2 w-12"></th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-gray-600" colSpan={4}>
                  Inga produkter i databasen.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="bg-white">
                  <td className="border px-3 py-2">{p.name}</td>
                  <td className="border px-3 py-2">{p.sku}</td>
                  <td className="border px-3 py-2">{formatSEK(p.price_cents)}</td>
                  <td className="border px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      disabled={busyId === p.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
                      aria-label="Ta bort"
                      title="Ta bort"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {busyId !== null && <div className="text-xs text-gray-500">Tar bort…</div>}
    </div>
  );
}
