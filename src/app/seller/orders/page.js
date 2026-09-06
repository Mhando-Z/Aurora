import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SellerOrderStatusControl from "@/components/orders/SellerOrderStatusControl";

function money(value, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export const metadata = {
  title: "Seller Orders | Aurora",
};

export default async function SellerOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sellerOrders, error } = await supabase
    .from("seller_orders")
    .select(`
      id,
      order_id,
      seller_id,
      status,
      subtotal,
      total,
      currency,
      created_at,
      order:orders!inner (
        order_number,
        status,
        payment_status,
        payment_method,
        shipping_address,
        placed_at
      ),
      items:order_items (
        id,
        product_title,
        product_image_url,
        quantity,
        line_total,
        currency
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-black/[0.025] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/45">
            Seller dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Orders to fulfill
          </h1>
        </div>

        {error ? (
          <p className="mt-8 text-red-600">{error.message}</p>
        ) : sellerOrders?.length ? (
          <div className="mt-8 space-y-5">
            {sellerOrders.map((sellerOrder) => (
              <article
                key={sellerOrder.id}
                className="rounded-3xl border border-black/10 bg-white p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="font-bold">{sellerOrder.order.order_number}</p>
                    <p className="mt-1 text-sm text-black/50">
                      {new Date(sellerOrder.order.placed_at).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs capitalize text-black/55">
                      Fulfillment: {sellerOrder.status.replaceAll("_", " ")}
                      {" · "}
                      Payment:{" "}
                      {sellerOrder.order.payment_status.replaceAll("_", " ")}
                      {" · "}
                      {sellerOrder.order.payment_method.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {money(sellerOrder.total, sellerOrder.currency)}
                    </p>
                    <div className="mt-3">
                      <SellerOrderStatusControl
                        sellerOrderId={sellerOrder.id}
                        currentStatus={sellerOrder.status}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {(sellerOrder.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[64px_1fr_auto] gap-3 rounded-2xl bg-black/[0.03] p-3"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                        {item.product_image_url ? (
                          <Image
                            src={item.product_image_url}
                            alt={item.product_title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {item.product_title}
                        </p>
                        <p className="mt-1 text-xs text-black/50">
                          Quantity {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {money(item.line_total, item.currency)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-black/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-black/45">
                    Delivery
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/65">
                    {sellerOrder.order.shipping_address?.full_name}
                    {" · "}
                    {sellerOrder.order.shipping_address?.phone}
                    <br />
                    {sellerOrder.order.shipping_address?.address_line},{" "}
                    {sellerOrder.order.shipping_address?.district},{" "}
                    {sellerOrder.order.shipping_address?.region}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white p-12 text-center text-black/55">
            No customer orders for your listings yet.
          </div>
        )}
      </div>
    </main>
  );
}
