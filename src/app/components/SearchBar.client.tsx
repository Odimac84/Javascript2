"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar({
  defaultValue = "",
  placeholder = "Sök produkt…",
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  useEffect(() => {
    setQ(defaultValue);
  }, [defaultValue]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />
    </form>
  );
}
