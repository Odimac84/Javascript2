import Link from "next/link";
import Image from "next/image";
import SearchBar from "@/components/SearchBar.client";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-56 lg:w-[220px]">
            <Image
              src={PLACEHOLDER_IMAGE}
              alt="Header banner"
              width={600}
              height={400}
              className="h-14 w-full rounded-md border object-cover"
              unoptimized
            />
          </div>

          <div className="flex w-full items-center justify-between gap-3 sm:col-start-2 sm:col-end-4">
            <div className="min-w-0 flex-1 sm:flex-none sm:w-[300px]">
              <SearchBar />
            </div>

            <div className="flex flex-shrink-0 items-center gap-3">
              <button
                type="button"
                className="h-10 rounded-md border px-3 text-sm"
                aria-label="Favoriter"
              >
                ♡
              </button>

              <Link
                href="/cart"
                className="flex h-10 items-center rounded-md border px-3 text-sm"
                aria-label="Varukorg"
              >
                🛒
              </Link>
            </div>
          </div>
        </div>

        <nav className="mt-3">
          <ul className="flex flex-wrap gap-4 text-sm">
            <li>
              <Link className="hover:underline" href="/nyheter">
                Nyheter
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/topplistan">
                Topplistan
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/rea">
                Rea
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/kampanjer">
                Kampanjer
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
