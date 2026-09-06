import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOnlinePaymentProvider } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request, { params }) {
  const { orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = getOnlinePaymentProvider();

  if (!provider.configured) {
    return NextResponse.json(
      { error: "Online payment provider is not configured." },
      { status: 501 },
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, status, payment_status, payment_method, total, currency")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_method !== "online") {
    return NextResponse.json(
      { error: "This order does not require online payment." },
      { status: 400 },
    );
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ success: true, alreadyPaid: true });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", order.id)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  try {
    const result = await provider.initialize({
      order,
      payment,
      user,
      origin,
    });

    const admin = createAdminClient();

    const { error: persistError } = await admin
      .from("payments")
      .update({
        provider: provider.key,
        provider_payment_id: result.providerPaymentId || null,
        provider_reference: result.providerReference || null,
        checkout_url: result.checkoutUrl || null,
        status: result.status || "requires_action",
        metadata: result.metadata || {},
      })
      .eq("id", payment.id);

    if (persistError) throw persistError;

    return NextResponse.json({
      success: true,
      provider: provider.key,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Could not initialize payment" },
      { status: 502 },
    );
  }
}
