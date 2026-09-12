import { createClient } from "@/lib/supabase/server";
import ProductsExplorer from "@/components/products/ProductsExplorer";
import HeroCarousel from "@/components/products/HeroCarousel";

export const metadata = {
  title: "Motorcycle Spare Parts",
};

export const revalidate = 60;

const carouselSlides = [
  {
    eyebrow: "New Arrivals",
    title: "Genuine OEM Parts, Fast",
    subtitle: "Sourced and verified engine parts for all major bike brands.",
    cta: "Shop new arrivals",
    image: "/carousel/oem-engine-parts.webp",
    href: "/products?condition=new",
  },
  {
    eyebrow: "Deal of the Week",
    title: "Up to 30% Off Brake Kits",
    subtitle: "Limited stock on select brake pad and disc bundles.",
    cta: "View offers",
    image: "/carousel/brake-kits-offer.webp",
    href: "/products?category=brakes",
  },
  {
    eyebrow: "Trusted Sellers",
    title: "Verified Riders, Verified Parts",
    subtitle: "Every listing is checked before it goes live.",
    cta: "Learn more",
    image: "/carousel/verified-sellers.webp",
    href: "/about",
  },
  {
    eyebrow: "Built for the Road",
    title: "Upgrade Your Ride with Confidence",
    subtitle:
      "Discover quality chains, sprockets, filters, and performance essentials.",
    cta: "Explore upgrades",
    image: "/carousel/performance-upgrades.webp",
    href: "/products?category=performance",
  },
  {
    eyebrow: "Find the Right Fit",
    title: "Parts That Match Your Motorcycle",
    subtitle: "Shop compatible parts by bike brand, model, and category.",
    cta: "Find my parts",
    image: "/carousel/motorcycle-fitment.webp",
    href: "/products",
  },
];

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
    <main className="min-h-screen bg-black/[0.025] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <HeroCarousel slides={carouselSlides} />

        <h1 className="mb-6 px-1 text-lg font-bold tracking-tight md:text-xl">
          Motorcycle Spare Parts
        </h1>

        {error ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            Products could not be loaded: {error.message}
          </div>
        ) : (
          <ProductsExplorer products={products ?? []} />
        )}
      </div>
    </main>
  );
}
