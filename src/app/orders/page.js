import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Orders | Aurora",
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
    .select(`
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
    `)
    .eq("customer_id", user.id)
    .order("placed_at", { ascending: false });

  return (
    <main className="min-h-screen bg-black/[0.025] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          My orders
        </h1>

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
          <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
            You have not placed an order yet.
          </div>
        )}
      </div>
    </main>
  );
}
