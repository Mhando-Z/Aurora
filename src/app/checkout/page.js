import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export const metadata = {
  title: "Checkout | Aurora",
};

export default async function CheckoutPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-black/[0.025] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/45">
          Secure checkout
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
          Complete your order
        </h1>

        <div className="mt-8">
          <CheckoutForm />
        </div>
      </div>
    </main>
  );
}
