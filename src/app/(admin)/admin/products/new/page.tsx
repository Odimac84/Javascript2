import NewProductForm from "./new-product-form.client";

export default function AdminNewProductPage() {
  return (
    <main className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Ny produkt</h1>

      <div className="mt-6">
        <NewProductForm />
      </div>
    </main>
  );
}
