import { createClient } from "@/lib/supabase/server";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

  const supabase = await createClient();

  const { data: products } = await supabase
    .from("product_listings")
    .select("id, updated_at, published_at")
    .eq("status", "published");

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },

    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const productPages =
    products?.map((product) => ({
      url: `${baseUrl}/products/${product.id}`,

      lastModified: product.updated_at || product.published_at || new Date(),

      changeFrequency: "weekly",

      priority: 0.8,
    })) ?? [];

  return [...staticPages, ...productPages];
}
