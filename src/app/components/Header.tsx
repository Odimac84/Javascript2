import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold">
            Freaky Fashion
          </Link>

          <div className="flex-1">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-neutral-900"
              placeholder="Sök produkt…"
            />
          </div>

          <span
            className="rounded-md border px-3 py-2 text-sm"
            aria-label="Favoriter"
          >
            ♡
          </span>

          <Link
            href="/cart"
            className="rounded-md border px-3 py-2 text-sm"
            aria-label="Varukorg"
          >
            🛒
          </Link>
        </div>

        <nav className="mt-3">
          <ul className="space-y-1 text-sm">
            <li><Link className="hover:underline" href="/nyheter">Nyheter</Link></li>
            <li><Link className="hover:underline" href="/topplistan">Topplistan</Link></li>
            <li><Link className="hover:underline" href="/rea">Rea</Link></li>
            <li><Link className="hover:underline" href="/kampanjer">Kampanjer</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
