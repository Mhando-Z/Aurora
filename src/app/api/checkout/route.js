import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation/commerce";
import { getAvailablePaymentMethods } from "@/lib/payments";

export async function POST(request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid checkout details" },
      { status: 400 },
    );
  }

  const methods = getAvailablePaymentMethods();

  if (parsed.data.paymentMethod === "online" && !methods.online) {
    return NextResponse.json(
      {
        error:
          "Online payment is not configured yet. Use cash on delivery or configure a payment provider.",
      },
      { status: 400 },
    );
  }

  const { data: orderId, error } = await supabase.rpc("checkout_active_cart", {
    p_shipping_address: parsed.data.shippingAddress,
    p_customer_note: parsed.data.customerNote || null,
    p_payment_method: parsed.data.paymentMethod,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    orderId,
    requiresPaymentInitialization: parsed.data.paymentMethod === "online",
  });
}
