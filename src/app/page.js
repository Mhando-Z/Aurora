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
    // subtitle: "Sourced and verified engine parts for all major bike brands.",
    subtitle:
      "Shop newly added genuine and verified engine parts, sourced for popular motorcycle brands and selected to deliver reliable performance, durability, and the right fit.",
    cta: "Shop new arrivals",
    image:
      "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/images/Genuine%20OEM%20Parts,%20Fast.png",
    href: "/products?condition=new",
  },
  {
    eyebrow: "Deal of the Week",
    title: "Up to 30% Off Brake Kits",
    // subtitle: "Limited stock on select brake pad and disc bundles.",
    subtitle:
      "Save on selected brake pads, discs, and complete braking kits designed to improve stopping performance, safety, and control. Limited quantities available.",

    cta: "View offers",
    image:
      "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/images/Up%20to%20Off%20Brake%20Kits.png",
    href: "/products?category=brakes",
  },
  {
    eyebrow: "Trusted Sellers",
    title: "Verified Riders, Verified Parts",
    // subtitle: "Every listing is checked before it goes live.",
    subtitle:
      "Buy with greater confidence from verified sellers. Listings are reviewed to improve product accuracy, quality, and transparency before reaching the marketplace.",

    cta: "Learn more",
    image:
      "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/images/Verified%20Riders,%20Verified%20Parts.png",
    href: "/about",
  },
  {
    eyebrow: "Built for the Road",
    title: "Upgrade Your Ride with Confidence",
    // subtitle:
    //   "Discover quality chains, sprockets, filters, and performance essentials.",
    subtitle:
      "Improve reliability and performance with quality chains, sprockets, filters, transmission components, and other essential upgrades built for everyday riding.",

    cta: "Explore upgrades",
    image:
      "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/images/Upgrade%20Your%20Ride%20with%20Confidence.png",
    href: "/products?category=performance",
  },
  {
    eyebrow: "Find the Right Fit",
    title: "Parts That Match Your Motorcycle",
    // subtitle: "Shop compatible parts by bike brand, model, and category.",
    subtitle:
      "Find compatible parts faster by selecting your motorcycle brand, model, and category, helping you avoid guesswork and choose components made for your bike.",

    cta: "Find my parts",
    image:
      "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/images/Parts%20That%20Match%20Your%20Motorcycle.png",
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
    <main className="min-h-screen bg-black/2.5 px-4 py-10 md:py-5 md:px-8">
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
