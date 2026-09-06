import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sellerStatusSchema } from "@/lib/validation/commerce";

export async function POST(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = sellerStatusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid status" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("seller_update_order_status", {
    p_seller_order_id: id,
    p_status: parsed.data.status,
    p_note: parsed.data.note || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, orderId: data });
}
