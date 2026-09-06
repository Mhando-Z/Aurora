import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "@/lib/validation/commerce";

async function requireUser(supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET() {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cartId, error: cartError } = await supabase.rpc(
    "get_or_create_active_cart",
  );

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 400 });
  }

  const { data: items, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      created_at,
      listing:product_listings!inner (
        id,
        seller_id,
        title,
        price,
        currency,
        quantity,
        status,
        condition,
        oem_part_number,
        images:product_listing_images (
          image_url,
          alt_text,
          is_primary,
          sort_order
        )
      )
    `,
    )
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const normalized = (items || []).map((item) => {
    const images = [...(item.listing?.images || [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );

    return {
      ...item,
      listing: {
        ...item.listing,
        primaryImage: images[0] || null,
      },
    };
  });

  const subtotal = normalized.reduce(
    (sum, item) =>
      sum + Number(item.listing?.price || 0) * Number(item.quantity || 0),
    0,
  );

  return NextResponse.json({
    cartId,
    items: normalized,
    itemCount: normalized.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    currency: normalized[0]?.listing?.currency || "TZS",
  });
}

export async function POST(request) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = addToCartSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid cart request" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("add_to_cart", {
    p_listing_id: parsed.data.listingId,
    p_quantity: parsed.data.quantity,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, cartItemId: data });
}

export async function PATCH(request) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateCartItemSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid cart update" },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("set_cart_item_quantity", {
    p_cart_item_id: parsed.data.cartItemId,
    p_quantity: parsed.data.quantity,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = removeCartItemSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid cart item" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("remove_cart_item", {
    p_cart_item_id: parsed.data.cartItemId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: data === true });
}
