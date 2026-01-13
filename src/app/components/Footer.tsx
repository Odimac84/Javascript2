"use client";

import { useState } from "react";
import Link from "next/link";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t py-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className="text-lg">{open ? "−" : "+"}</span>
      </button>

      {open && <div className="mt-2 text-sm text-neutral-600">{children}</div>}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-10 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">

        {/* MOBILE: accordion */}
        <div className="mt-6 sm:hidden">
          <Section title="Shopping">
            <ul className="space-y-1">
              <li><Link href="">Nyheter</Link></li>
              <li><Link href="">Topplistan</Link></li>
              <li><Link href="">Rea</Link></li>
              <li><Link href="">Kampanjer</Link></li>
            </ul>
          </Section>

          <Section title="Mina sidor">
            <ul className="space-y-1">
              <li><Link href="">Min profil</Link></li>
              <li><Link href="">Mina ordrar</Link></li>
              <li><Link href="">Mina favoriter</Link></li>
            </ul>
          </Section>

          <Section title="Kundtjänst">
            <ul className="space-y-1">
              <li><Link href="">Kontakt</Link></li>
              <li><Link href="">Returer</Link></li>
              <li><Link href="">Frakt</Link></li>
            </ul>
          </Section>
        </div>

        {/* SM+ : open menus in 3 columns */}
        <div className="mt-8 hidden gap-8 text-sm sm:grid sm:grid-cols-3">
          <div>
            <div className="font-medium">Shopping</div>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li><Link href="">Nyheter</Link></li>
              <li><Link href="">Topplistan</Link></li>
              <li><Link href="">Rea</Link></li>
              <li><Link href="">Kampanjer</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-medium">Mina sidor</div>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li><Link href="">Min profil</Link></li>
              <li><Link href="">Mina ordrar</Link></li>
              <li><Link href="">Mina favoriter</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-medium">Kundtjänst</div>
            <ul className="mt-2 space-y-1 text-neutral-600">
              <li><Link href="">Kontakt</Link></li>
              <li><Link href="">Returer</Link></li>
              <li><Link href="">Frakt</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-neutral-500">© Freaky Fashion</div>
      </div>
    </footer>
  );
}
