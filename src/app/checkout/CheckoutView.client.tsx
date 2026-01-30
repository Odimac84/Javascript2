"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart/cart.context";

function formatSek(cents: number) {
  const sek = cents / 100;
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(sek);
}

type FieldKey = "firstName" | "lastName" | "email" | "street" | "postalCode" | "city" | "acceptTerms";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  newsletterOptIn: boolean;
  acceptTerms: boolean;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// inline style -> kan inte försvinna pga annan CSS
function inputStyle(hasError: boolean): React.CSSProperties {
  if (!hasError) return {};
  return {
    borderColor: "#ef4444",
    boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.45)",
    backgroundColor: "#fef2f2",
  };
}

function apiIssuesToFieldErrors(apiError: any): Partial<Record<FieldKey, string>> {
  const out: Partial<Record<FieldKey, string>> = {};
  const issues = apiError?.issues;
  if (!Array.isArray(issues)) return out;

  for (const issue of issues) {
    const path = Array.isArray(issue?.path) ? issue.path : [];
    if (path[0] === "customer" && path[1] === "firstName") out.firstName = "Förnamn saknas.";
    if (path[0] === "customer" && path[1] === "lastName") out.lastName = "Efternamn saknas.";
    if (path[0] === "customer" && path[1] === "email") out.email = "E-postadress är felaktig.";
    if (path[0] === "address" && path[1] === "street") out.street = "Gata saknas.";
    if (path[0] === "address" && path[1] === "postalCode") out.postalCode = "Postnummer saknas.";
    if (path[0] === "address" && path[1] === "city") out.city = "Stad saknas.";
  }

  return out;
}

function TextInput({
  value,
  onChange,
  error,
  className = "",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <input
        className={`h-10 rounded-md border px-3 text-sm outline-none ${className}`}
        style={{ ...(style ?? {}), ...(error ? inputStyle(true) : {}) }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}

export default function CheckoutView() {
  const { state, subtotalCents, clear } = useCart();
  const items = state.items;

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    postalCode: "",
    city: "",
    newsletterOptIn: false,
    acceptTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [showGenericError, setShowGenericError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);

  const computed = useMemo(
    () =>
      items.map((i) => ({
        ...i,
        lineTotalCents: i.unitPriceCents * i.qty,
      })),
    [items]
  );

  const payloadItems = useMemo(
    () => items.map((i) => ({ productId: i.productId, qty: i.qty })),
    [items]
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as FieldKey];
      return next;
    });
    setShowGenericError(false);
  }

  function validateClient(): boolean {
    const errs: Partial<Record<FieldKey, string>> = {};

    if (!form.firstName.trim()) errs.firstName = "Förnamn saknas.";
    if (!form.lastName.trim()) errs.lastName = "Efternamn saknas.";

    if (!form.email.trim()) {
      errs.email = "E-postadress saknas.";
    } else if (!isValidEmail(form.email)) {
      errs.email = "E-postadressen är felaktig (ex: namn@mail.se).";
    }

    if (!form.street.trim()) errs.street = "Gata saknas.";
    if (!form.postalCode.trim()) errs.postalCode = "Postnummer saknas.";
    if (!form.city.trim()) errs.city = "Stad saknas.";

    if (!form.acceptTerms) errs.acceptTerms = "Du måste acceptera villkoren.";

    setFieldErrors(errs);
    setShowGenericError(Object.keys(errs).length > 0);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    setFieldErrors({});
    setShowGenericError(false);

    if (items.length === 0) return;
    if (!validateClient()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
          },
          address: {
            street: form.street,
            postalCode: form.postalCode,
            city: form.city,
            country: "SE",
          },
          newsletterOptIn: form.newsletterOptIn,
          items: payloadItems,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const apiErrs = apiIssuesToFieldErrors(data?.error);
        if (Object.keys(apiErrs).length > 0) setFieldErrors(apiErrs);
        setShowGenericError(true);
        return;
      }

      const orderId = Number(data?.order?.id || 0);
      clear();
      setSuccess(orderId);
    } catch {
      setShowGenericError(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="mx-auto w-full max-w-5xl py-8">
        <h1 className="text-center text-2xl font-semibold">Kassan</h1>

        <div className="mx-auto mt-6 max-w-lg rounded-2xl border p-6 text-center">
          <div className="text-lg font-medium">Tack! Din order är skapad.</div>
          <div className="mt-2 text-sm text-gray-600">
            Ordernummer: <span className="font-medium">{success || "—"}</span>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link className="rounded-md border px-4 py-2 text-sm font-semibold" href="/">
              Till startsidan
            </Link>
            <Link className="rounded-md border px-4 py-2 text-sm font-semibold" href="/cart">
              Till varukorgen
            </Link>
          </div>
        </div>
      </main>
    );
  }
  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-5xl py-8">
        <h1 className="text-center text-2xl font-semibold">Kassan</h1>

        <div className="mx-auto mt-6 max-w-lg rounded-2xl border p-6 text-center text-sm text-gray-600">
          Varukorgen är tom.{" "}
          <Link className="underline" href="/">
            Fortsätt handla
          </Link>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link className="underline text-gray-700" href="/cart">
            Tillbaka till varukorgen
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl py-8">
      <h1 className="text-center text-2xl font-semibold">Kassan</h1>

      {/* SUMMARY */}
      <section className="mt-6 sm:block">
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-b px-3 py-2 text-left font-medium">Produkt</th>
                <th className="border-b px-3 py-2 text-left font-medium">Antal</th>
                <th className="border-b px-3 py-2 text-left font-medium">Pris</th>
                <th className="border-b px-3 py-2 text-left font-medium">Totalt</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((it) => (
                <tr key={it.productId} className="border-b last:border-b-0">
                  <td className="px-3 py-3 align-middle">{it.name}</td>
                  <td className="px-3 py-3 align-middle">{it.qty}</td>
                  <td className="px-3 py-3 align-middle">{formatSek(it.unitPriceCents)}</td>
                  <td className="px-3 py-3 align-middle">{formatSek(it.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-right text-sm">
          <span className="text-gray-600">Summa: </span>
          <span className="font-medium">{formatSek(subtotalCents)}</span>
        </div>
      </section>

      <section className="mt-8 sm:hidden">
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium">Kunduppgifter</div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span>Förnamn</span>
              <TextInput value={form.firstName} onChange={(v) => set("firstName", v)} error={fieldErrors.firstName} />
            </label>

            <label className="grid gap-1 text-sm">
              <span>Efternamn</span>
              <TextInput value={form.lastName} onChange={(v) => set("lastName", v)} error={fieldErrors.lastName} />
            </label>

            <label className="grid gap-1 text-sm">
              <span>E-post</span>
              <TextInput value={form.email} onChange={(v) => set("email", v)} error={fieldErrors.email} />
            </label>

            <div className="rounded-xl border p-3">
              <div className="text-xs font-medium">Adress</div>

              <div className="mt-3 grid gap-3">
                <label className="grid gap-1 text-sm">
                  <span>Gata</span>
                  <TextInput value={form.street} onChange={(v) => set("street", v)} error={fieldErrors.street} />
                </label>

                <label className="grid gap-1 text-sm">
                  <span style={{ width: 150 }}>Postnummer</span>
                  <TextInput
                    value={form.postalCode}
                    onChange={(v) => set("postalCode", v)}
                    error={fieldErrors.postalCode}
                    className="w-3/5"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span>Stad</span>
                  <TextInput value={form.city} onChange={(v) => set("city", v)} error={fieldErrors.city} />
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.newsletterOptIn}
                onChange={(e) => set("newsletterOptIn", e.target.checked)}
              />
              <span>Jag vill ta emot nyhetsbrev</span>
            </label>

            <label className={`flex items-center gap-2 text-sm ${fieldErrors.acceptTerms ? "text-red-700" : ""}`}>
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => set("acceptTerms", e.target.checked)}
              />
              <span>Jag har läst och accepterar villkoren</span>
            </label>
            {fieldErrors.acceptTerms && <div className="text-xs text-red-600">{fieldErrors.acceptTerms}</div>}

            {showGenericError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Kontrollera de markerade fälten och försök igen.
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className={`h-12 min-w-64 rounded-md border px-10 text-base font-semibold ${
                  loading ? "bg-gray-100 text-gray-500" : "bg-white text-black"
                }`}
              >
                {loading ? "Köper..." : "Köp"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 hidden sm:block">
        <div className="rounded-2xl border p-6">
          <div className="text-sm font-medium">Kunduppgifter</div>

          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-1 text-sm">
                <span>Förnamn</span>
                <TextInput value={form.firstName} onChange={(v) => set("firstName", v)} error={fieldErrors.firstName} className="w-full" />
              </label>

              <label className="grid gap-1 text-sm">
                <span>Efternamn</span>
                <TextInput value={form.lastName} onChange={(v) => set("lastName", v)} error={fieldErrors.lastName} className="w-full" />
              </label>
            </div>

            <label className="grid gap-1 text-sm w-1/2">
              <span>E-post</span>
              <TextInput value={form.email} onChange={(v) => set("email", v)} error={fieldErrors.email} className="w-full" />
            </label>

            <div className="rounded-xl border p-4">
              <div className="text-xs font-medium">Adress</div>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-1 text-sm " style={{ maxWidth: "60%", minWidth: "500px" }}>
                  <span>Gata</span>
                  <div className="w-full lg:w-3/5">
                    <TextInput
                      value={form.street}
                      onChange={(v) => set("street", v)}
                      error={fieldErrors.street}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid gap-1 text-sm">
                  <span>Postnummer</span>
                  <div style={{ width: 150 }}>
                    <TextInput
                      value={form.postalCode}
                      onChange={(v) => set("postalCode", v)}
                      error={fieldErrors.postalCode}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid gap-1 text-sm">
                  <span>Stad</span>
                  <div style={{ width: 200 }}>
                    <TextInput
                      value={form.city}
                      onChange={(v) => set("city", v)}
                      error={fieldErrors.city}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.newsletterOptIn}
                onChange={(e) => set("newsletterOptIn", e.target.checked)}
              />
              <span>Jag vill ta emot nyhetsbrev</span>
            </label>

            <label className={`flex items-center gap-2 text-sm ${fieldErrors.acceptTerms ? "text-red-700" : ""}`}>
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => set("acceptTerms", e.target.checked)}
              />
              <span>Jag har läst och accepterar villkoren</span>
            </label>
            {fieldErrors.acceptTerms && <div className="text-xs text-red-600">{fieldErrors.acceptTerms}</div>}

            {showGenericError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Kontrollera de markerade fälten och försök igen.
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className={`h-12 min-w-64 rounded-md border px-10 text-base font-semibold ${
                  loading ? "bg-gray-100 text-gray-500" : "bg-white text-black"
                }`}
              >
                {loading ? "Köper..." : "Köp"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 text-center text-sm">
        <Link className="underline text-gray-700" href="/cart">
          Tillbaka till varukorgen
        </Link>
      </div>
    </main>
  );
}
