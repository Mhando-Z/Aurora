import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductsClient from "./ProductsClient";

export default async function Products() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/dashboard/products");
  }

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
    .eq("seller_id", userId)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Failed to load seller products:", error);
  }

  const normalizedProducts = (products || []).map((product) => ({
    ...product,
    images: [...(product.images || [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    ),
  }));

  return <ProductsClient initialProducts={normalizedProducts} />;
}
