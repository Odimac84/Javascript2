import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main>
      <h1 className="text-xl font-semibold">Administration</h1>

      <div className="mt-6 grid gap-3 max-w-xl">
        <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/admin/products">
          <div className="font-medium">Produkter</div>
          <div className="text-sm text-gray-600">Se alla produkter</div>
        </Link>

        <Link className="rounded-xl border p-4 hover:bg-gray-50" href="/admin/products/new">
          <div className="font-medium">Ny produkt</div>
          <div className="text-sm text-gray-600">Lägg till en ny produkt</div>
        </Link>

        <div className="rounded-md border px-4 py-3 text-sm text-gray-600">
          (Framtid) Kategorier, rabattkoder, osv.
        </div>
      </div>
    </main>
  );
}
