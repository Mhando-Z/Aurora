import { createClient } from "@/lib/supabase/server";

export async function POST(_request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("publish_product_listing", {
    p_listing_id: id,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ listingId: data, status: "published" });
}
