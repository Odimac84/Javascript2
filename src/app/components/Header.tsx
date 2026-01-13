import Link from "next/link";
import Image from "next/image";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        {/* Top area: image + search + icons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-56">
            <Image
              src={PLACEHOLDER_IMAGE}
              alt="Header banner"
              width={600}
              height={400}
              className="h-14 w-full rounded-md border object-cover"
            />
          </div>

          <div className="flex w-full items-center gap-3">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-neutral-900"
              placeholder="Sök produkt…"
            />

            {/* icons always in a row */}
            <div className="flex items-center gap-3">
              <span className="rounded-md border px-3 py-2 text-sm" aria-label="Favoriter">
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
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-3">
          <ul className="space-y-1 text-sm sm:flex sm:gap-4 sm:space-y-0">
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
