import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="h-12 bg-neutral-900 text-white">
        <div className="flex h-full items-center px-4">
          <span className="text-sm font-semibold">Administration</span>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-48px)] w-full">
        <aside className="w-[260px] shrink-0 border-r bg-gray-100">
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
        <main
          className="min-w-0 flex-1 p-6"
          style={{ width: "80%", maxWidth: "none" }}
        >
          <div style={{ width: "100%", maxWidth: "none" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
