import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CancelOrderButton from "@/components/orders/CancelOrderButton";

function money(value, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_id,
      status,
      payment_status,
      payment_method,
      subtotal,
      shipping_fee,
      total,
      currency,
      shipping_address,
      customer_note,
      placed_at,
      cancelled_at,
      cancellation_reason,
      seller_orders (
        id,
        seller_id,
        status,
        subtotal,
        total,
        confirmed_at,
        processing_at,
        shipped_at,
        delivered_at
      ),
      items:order_items (
        id,
        seller_order_id,
        product_listing_id,
        product_title,
        product_image_url,
        oem_part_number,
        condition,
        unit_price,
        quantity,
        line_total,
        currency
      ),
      payments (
        id,
        provider,
        method,
        status,
        amount,
        currency,
        paid_at
      )
    `)
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (error || !order) notFound();

  const canCancel =
    ["awaiting_payment", "confirmed"].includes(order.status) &&
    !(order.seller_orders || []).some((sellerOrder) =>
      ["processing", "shipped", "delivered"].includes(sellerOrder.status),
    );

  return (
    <main className="min-h-screen bg-black/[0.025] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm text-black/50">Order</p>
            <h1 className="mt-1 text-3xl font-bold">{order.order_number}</h1>
            <p className="mt-2 text-sm text-black/55">
              Placed {new Date(order.placed_at).toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm capitalize">
              Order: <strong>{order.status.replaceAll("_", " ")}</strong>
            </p>
            <p className="mt-1 text-sm capitalize">
              Payment:{" "}
              <strong>{order.payment_status.replaceAll("_", " ")}</strong>
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            {(order.items || []).map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[84px_1fr_auto] gap-4 rounded-3xl border border-black/10 bg-white p-4"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/[0.04]">
                  {item.product_image_url ? (
                    <Image
                      src={item.product_image_url}
                      alt={item.product_title}
                      fill
                      className="object-cover"
                      sizes="84px"
                    />
                  ) : null}
                </div>

                <div>
                  <h2 className="font-semibold">{item.product_title}</h2>
                  <p className="mt-1 text-sm capitalize text-black/50">
                    {item.condition} · Qty {item.quantity}
                  </p>
                  {item.oem_part_number ? (
                    <p className="mt-1 text-xs text-black/45">
                      OEM: {item.oem_part_number}
                    </p>
                  ) : null}
                </div>

                <p className="font-semibold">
                  {money(item.line_total, item.currency)}
                </p>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-3xl border border-black/10 bg-white p-6">
            <h2 className="font-semibold">Summary</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-black/50">Subtotal</span>
                <span>{money(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/50">Delivery</span>
                <span>{money(order.shipping_fee, order.currency)}</span>
              </div>
              <div className="h-px bg-black/10" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{money(order.total, order.currency)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold">Delivery address</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                {order.shipping_address?.full_name}
                <br />
                {order.shipping_address?.phone}
                <br />
                {order.shipping_address?.address_line}
                <br />
                {order.shipping_address?.district},{" "}
                {order.shipping_address?.region}
                {order.shipping_address?.landmark ? (
                  <>
                    <br />
                    Near {order.shipping_address.landmark}
                  </>
                ) : null}
              </p>
            </div>

            {canCancel ? (
              <div className="mt-6">
                <CancelOrderButton orderId={order.id} />
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
