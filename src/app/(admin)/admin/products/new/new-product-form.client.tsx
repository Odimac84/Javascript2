"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Errors = Partial<Record<"name" | "imageUrl" | "sku" | "priceSek", string>>;

function isValidUrl(s: string) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function skuNormalize(s: string) {
  return s.trim().toUpperCase();
}

// XXXYYY (A–Z)(A–Z)(0–9)(0–9)(0–9)
function skuIsValid(s: string) {
  return /^[A-Z]{3}\d{3}$/.test(s);
}

function toPriceCents(priceSek: string) {
  const s = priceSek.trim().replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewProductForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState(""); 
  const [imageUrl, setImageUrl] = useState("");
  const [brand, setBrand] = useState(""); 
  const [sku, setSku] = useState("");
  const [priceSek, setPriceSek] = useState("");
  const [publishedAt, setPublishedAt] = useState(todayYYYYMMDD()); 

  const [errors, setErrors] = useState<Errors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const priceCents = useMemo(() => toPriceCents(priceSek), [priceSek]);

  function validate(): boolean {
    const e: Errors = {};

    const n = name.trim();
    if (!n) e.name = "Namn är obligatoriskt.";
    else if (n.length > 25) e.name = "Max 25 tecken.";

    const img = imageUrl.trim();
    if (!img) e.imageUrl = "URL till bild är obligatoriskt.";
    else if (!isValidUrl(img)) e.imageUrl = "Ogiltig URL.";

    const s = skuNormalize(sku);
    if (!s) e.sku = "SKU är obligatoriskt.";
    else if (!skuIsValid(s)) e.sku = "SKU måste vara i formatet XXXYYY (ex: ABC123).";

    if (priceCents === null) e.priceSek = "Pris är obligatoriskt (siffra).";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function inputClass(key: keyof Errors) {
    return `h-9 w-full rounded-md border px-3 text-sm outline-none ${
      errors[key] ? "border-red-500" : ""
    }`;
  }

  async function submit() {
    setGlobalError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const d = description.trim();
      const b = brand.trim();
      const finalDescription = b ? `Märke: ${b}\n\n${d}`.trim() : d || undefined;

      const body = {
        sku: skuNormalize(sku),
        name: name.trim(),
        description: finalDescription,
        imageUrl: imageUrl.trim(),
        priceCents: priceCents!,
        publishedAt: publishedAt ? `${publishedAt}T00:00:00.000Z` : undefined,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : "Kunde inte skapa produkt. Kontrollera fälten.";
        setGlobalError(msg);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setGlobalError("Kunde inte skapa produkt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="block"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-5">
        {globalError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {globalError}
          </div>
        )}

        <div className="grid gap-1">
          <label className="text-sm font-medium">Namn</label>
          <input
            className={inputClass("name")}
            placeholder="Ange namn"
            value={name}
            maxLength={25}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <div className="text-xs text-red-600">{errors.name}</div>}
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Beskrivning</label>
          <textarea
            className="min-h-32 w-full rounded-md border px-3 py-2 text-sm outline-none"
            placeholder="Ange beskrivning"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Bild</label>
          <input
            className={inputClass("imageUrl")}
            placeholder="Ange URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {errors.imageUrl && <div className="text-xs text-red-600">{errors.imageUrl}</div>}
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Märke</label>
          <input
            className="h-9 w-full rounded-md border px-3 text-sm outline-none"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">SKU</label>
          <input
            className={inputClass("sku")}
            placeholder="Ange SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onBlur={() => setSku((v) => skuNormalize(v))}
          />
          {errors.sku && <div className="text-xs text-red-600">{errors.sku}</div>}
        </div>

        <div className="grid gap-1" style={{ width: 140 }}>
          <label className="text-sm font-medium">Pris</label>
          <input
            className={inputClass("priceSek")}
            value={priceSek}
            onChange={(e) => setPriceSek(e.target.value)}
            inputMode="decimal"
            placeholder="199"
          />
          {errors.priceSek && <div className="text-xs text-red-600">{errors.priceSek}</div>}
        </div>


        <div className="grid gap-1" style={{ width: 240 }}>
          <label className="text-sm font-medium">Publiceringsdatum</label>
          <input
            className="h-9 w-full rounded-md border px-3 text-sm outline-none"
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`h-10 rounded-md border px-5 text-sm font-semibold ${
              loading ? "bg-gray-100 text-gray-500" : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {loading ? "Lägger till..." : "Lägg till"}
          </button>
        </div>
      </div>
    </form>
  );
}
