import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CartClient from "@/components/cart/CartClient";

export const metadata = {
  title: "Cart | Aurora",
};

export default async function CartPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-black/2.5 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/45">
          Aurora
        </p>

        <div className="mt-2">
          <CartClient />
        </div>
      </div>
    </main>
  );
}
