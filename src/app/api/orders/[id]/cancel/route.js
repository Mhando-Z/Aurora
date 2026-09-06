import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelOrderSchema } from "@/lib/validation/commerce";

export async function POST(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = cancelOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid cancellation" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("cancel_customer_order", {
    p_order_id: id,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, orderId: data });
}
