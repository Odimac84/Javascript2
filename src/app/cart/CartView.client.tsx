"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart.context";

function formatSek(cents: number) {
  const sek = cents / 100;
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(sek);
}

function QtySelect({
  value,
  onChange,
  max = 10,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
}) {
  return (
    <select
      className="h-8 w-14 rounded-md border bg-white text-sm"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Antal"
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function TrashButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
      onClick={onClick}
      aria-label="Ta bort"
      title="Ta bort"
    >
      🗑️
    </button>
  );
}

export default function CartView() {
  const { state, remove, subtotalCents, setQty } = useCart();
  const items = state.items;
  const hasItems = items.length > 0;

  return (
    <main className="mx-auto w-full max-w-5xl py-8">
      <h1 className="text-center text-2xl font-semibold">Varukorgen</h1>

      {/* ✅ MOBIL (< 640px): boxar i kolumn */}
      <section className="mt-6 sm:hidden">
        {!hasItems ? (
          <div className="rounded-2xl border p-4 text-sm text-gray-600">
            Din varukorg är tom.{" "}
            <Link className="underline font-bold" href="/">
              Fortsätt handla
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((it) => {
              const lineTotal = it.unitPriceCents * it.qty;

              return (
                <div key={it.productId} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {it.slug ? (
                        <Link className="font-medium hover:underline" href={`/products/${it.slug}`}>
                          {it.name}
                        </Link>
                      ) : (
                        <div className="font-medium">{it.name}</div>
                      )}
                      <div className="mt-1 text-sm text-gray-600">{formatSek(it.unitPriceCents)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-600">Totalt</div>
                      <div className="text-sm font-medium">{formatSek(lineTotal)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <QtySelect value={it.qty} onChange={(n) => setQty(it.productId, n)} max={10} />
                    <TrashButton onClick={() => remove(it.productId)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ✅ TABLET + DESKTOP (>= 640px): tabell */}
      <section className="mt-6 hidden sm:block">
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-b px-3 py-2 text-left font-medium">Produkt</th>
                <th className="border-b px-3 py-2 text-left font-medium">Antal</th>
                <th className="border-b px-3 py-2 text-left font-medium">Pris</th>
                <th className="border-b px-3 py-2 text-left font-medium">Totalt</th>
                <th className="border-b px-3 py-2"></th>
              </tr>
            </thead>

            <tbody>
              {!hasItems ? (
                <tr>
                  <td className="px-3 py-6 text-gray-600" colSpan={5}>
                    Din varukorg är tom.{" "}
                    <Link className="underline font-bold" href="/">
                      Fortsätt handla
                    </Link>
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const lineTotal = it.unitPriceCents * it.qty;

                  return (
                    <tr key={it.productId} className="border-b last:border-b-0">
                      <td className="px-3 py-3 align-middle">
                        {it.slug ? (
                          <Link className="hover:underline" href={`/products/${it.slug}`}>
                            {it.name}
                          </Link>
                        ) : (
                          it.name
                        )}
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <QtySelect value={it.qty} onChange={(n) => setQty(it.productId, n)} max={10} />
                      </td>

                      <td className="px-3 py-3 align-middle">{formatSek(it.unitPriceCents)}</td>
                      <td className="px-3 py-3 align-middle">{formatSek(lineTotal)}</td>

                      <td className="px-3 py-3 text-right align-middle">
                        <TrashButton onClick={() => remove(it.productId)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {hasItems && (
          <div className="mt-3 text-right text-sm">
            <span className="text-gray-600">Summa: </span>
            <span className="font-medium">{formatSek(subtotalCents)}</span>
          </div>
        )}
      </section>

      {/* ✅ CTA: renderas BARA om varukorgen har items */}
      {hasItems && (
        <div className="mt-8 flex justify-center">
          <Link
            href="/checkout"
            className="inline-flex h-12 min-w-64 items-center justify-center rounded-md border px-10 text-base font-semibold bg-white text-black"
          >
            Till kassan
          </Link>
        </div>
      )}
    </main>
  );
}
