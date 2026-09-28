import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PackageOpen } from "lucide-react";

export const metadata = {
  title: "My Orders",
};

function money(value, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      payment_method,
      total,
      currency,
      placed_at,
      items:order_items (
        id,
        product_title,
        quantity
      )
    `,
    )
    .eq("customer_id", user.id)
    .order("placed_at", { ascending: false });

  return (
    <main className="min-h-screen bg-black/2.5 py-10 md:px-8">
      <div className="flex flex-col container mx-auto max-w-7xl px-6">
        <h1 className="text-xl font-bold tracking-tight">My orders</h1>

        {error ? (
          <p className="mt-8 text-red-600">{error.message}</p>
        ) : orders?.length ? (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-3xl border border-black/10 bg-white p-5 transition hover:border-black/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="mt-1 text-sm text-black/50">
                      {new Date(order.placed_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      {money(order.total, order.currency)}
                    </p>
                    <p className="mt-1 text-xs capitalize text-black/55">
                      {order.status.replaceAll("_", " ")} ·{" "}
                      {order.payment_status.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-black/55">
                  {(order.items || [])
                    .map((item) => `${item.quantity}× ${item.product_title}`)
                    .join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-black/10 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black/[0.04]">
              <PackageOpen
                className="h-8 w-8 text-black/50"
                strokeWidth={1.6}
              />
            </div>

            <h3 className="mt-5 text-lg font-semibold tracking-tight text-black">
              No orders yet
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/50">
              You haven&apos;t placed any orders yet. Once you make a purchase,
              your orders will appear here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
