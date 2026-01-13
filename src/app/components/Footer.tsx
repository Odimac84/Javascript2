"use client";

import { useState } from "react";
import Link from "next/link";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">🌍 <span>Gratis frakt och returer</span></div>
          <div className="flex items-center gap-2">✈️ <span>Expressfrakt</span></div>
          <div className="flex items-center gap-2">🛡️ <span>Säkra betalningar</span></div>
          <div className="flex items-center gap-2">🙂 <span>Nyheter varje dag</span></div>
        </div>

        <div className="mt-6">
          <Section title="Shopping">
            <ul className="space-y-1">
              <li><Link href="/nyheter">Nyheter</Link></li>
              <li><Link href="/topplistan">Topplistan</Link></li>
              <li><Link href="/rea">Rea</Link></li>
              <li><Link href="/kampanjer">Kampanjer</Link></li>
            </ul>
          </Section>

          <Section title="Mina sidor">
            <ul className="space-y-1">
              <li><Link href="/account">Min profil</Link></li>
              <li><Link href="/orders">Mina ordrar</Link></li>
              <li><Link href="/favorites">Mina favoriter</Link></li>
            </ul>
          </Section>

          <Section title="Kundtjänst">
            <ul className="space-y-1">
              <li><Link href="/contact">Kontakt</Link></li>
              <li><Link href="/returns">Returer</Link></li>
              <li><Link href="/shipping">Frakt</Link></li>
            </ul>
          </Section>
        </div>

        <div className="mt-6 text-center text-xs text-neutral-500">© Freaky Fashion</div>
      </div>
    </footer>
  );
}
