import CreateListingForm from "@/components/products/CreateListingForm";

export const metadata = {
  title: "Sell a Spare Part | Aurora",
};

export default function SellPage() {
  return (
    <main className="min-h-screen bg-black/[0.025] px-4 py-10 md:px-8">
      <div className="mx-auto mb-8 max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/50">
          Aurora Marketplace
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
          Sell a motorcycle spare part
        </h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Choose fitment from Aurora’s reference catalog, add seller-specific product details, then upload images to Sanity.
        </p>
      </div>

      <CreateListingForm />
    </main>
  );
}
