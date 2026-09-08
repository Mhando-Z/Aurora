import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/products/ProductCard";

export const metadata = {
  title: "Motorcycle Spare Parts | Aurora",
};

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("product_listings")
    .select(
      `
      id,
      title,
      price,
      currency,
      condition,
      quantity,
      published_at,
      images:product_listing_images (
        id,
        image_url,
        alt_text,
        sort_order,
        is_primary
      )
    `,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(48);

  return (
    <main className="min-h-screen bg-black/2.5 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/50">
              Aurora Marketplace
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              Motorcycle spare parts
            </h1>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            Products could not be loaded: {error.message}
          </div>
        ) : products?.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center text-black/55">
            No published products yet.
          </div>
        )}
      </div>
    </main>
  );
}
