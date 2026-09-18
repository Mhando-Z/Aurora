import CreateListingForm from "@/components/products/CreateListingForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sell a Spare Part | Aurora",
  description: "List your motorcycle spare parts for sale on Aurora.",
};

export default async function SellPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-black/2.5 px-4 py-10 md:px-8">
      <div className="mx-auto mb-8 max-w-7xl px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/50">
          Aurora Marketplace
        </p>
        <h1 className="mt-3 font-bold tracking-tight text-xl">
          Sell a motorcycle spare part
        </h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Choose fitment from Aurora’s reference catalog, add seller-specific
          product details, then upload images to Sanity.
        </p>
      </div>

      <CreateListingForm />
    </main>
  );
}
