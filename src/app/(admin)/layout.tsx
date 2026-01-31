import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="h-12 bg-neutral-900 text-white">
        <div className="flex h-full items-center px-4">
          <span className="text-sm font-semibold">Administration</span>
        </div>
      </header>

      {/* Full width shell */}
      <div className="flex min-h-[calc(100vh-48px)]">
        <aside className="w-[260px] border-r bg-gray-100">
          <div className="p-4">
            <div className="text-sm font-semibold">Produkter</div>

            <nav className="mt-2 grid gap-1">
              <Link
                href="/admin/products"
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white"
              >
                Produkter
              </Link>
            </nav>
          </div>
        </aside>

        <section className="flex-1 p-6">{children}</section>
      </div>
    </div>
  );
}
