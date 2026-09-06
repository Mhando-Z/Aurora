import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function money(value, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("product_listings")
    .select(
      `
      id,
      title,
      description,
      oem_part_number,
      condition,
      price,
      currency,
      quantity,
      is_negotiable,
      status,
      published_at,
      spare_part:spare_parts (
        id,
        name,
        description,
        category:part_categories (id, name, slug)
      ),
      images:product_listing_images (
        id,
        image_url,
        alt_text,
        sort_order,
        is_primary
      ),
      fitments:product_listing_fitments (
        fitment_status,
        fitment_note,
        model:motorcycle_models (
          id,
          name,
          engine_label,
          motorcycle_type,
          brand:brands (id, name, slug)
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !product || product.status !== "published") notFound();

  const images = [...(product.images ?? [])].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      a.sort_order - b.sort_order,
  );

  return (
    <main className="min-h-screen bg-black/[0.025] px-4 py-10 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {images.length ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`relative overflow-hidden rounded-3xl bg-white ${
                    index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"
                  }`}
                >
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || product.title}
                    fill
                    priority={index === 0}
                    sizes={
                      index === 0 ? "(max-width: 1024px) 100vw, 50vw" : "25vw"
                    }
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-black/50">
            {product.spare_part?.category?.name} · {product.spare_part?.name}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {product.title}
          </h1>
          <p className="mt-5 text-3xl font-bold">
            {money(product.price, product.currency)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-black/[0.035] p-4">
              <p className="text-black/45">Condition</p>
              <p className="mt-1 font-semibold capitalize">
                {product.condition}
              </p>
            </div>
            <div className="rounded-2xl bg-black/[0.035] p-4">
              <p className="text-black/45">Stock</p>
              <p className="mt-1 font-semibold">{product.quantity}</p>
            </div>
          </div>

          {product.oem_part_number && (
            <div className="mt-6">
              <p className="text-sm text-black/45">OEM / part number</p>
              <p className="mt-1 font-semibold">{product.oem_part_number}</p>
            </div>
          )}

          {product.description && (
            <div className="mt-6">
              <h2 className="font-semibold">Description</h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-black/65">
                {product.description}
              </p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-semibold">Seller-declared fitment</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(product.fitments ?? []).map((fitment) => (
                <span
                  key={fitment.model?.id}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-2 text-sm"
                >
                  {fitment.model?.brand?.name} {fitment.model?.name}
                  {fitment.model?.engine_label
                    ? ` · ${fitment.model.engine_label}`
                    : ""}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-black/45">
              Confirm OEM number and physical fitment before purchase.
              Seller-declared fitment is not automatically
              manufacturer-verified.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
