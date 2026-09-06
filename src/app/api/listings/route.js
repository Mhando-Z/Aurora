import { createClient } from "@/lib/supabase/server";
import { listingDraftSchema } from "@/lib/validation/listing";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = listingDraftSchema.parse(await request.json());

    const { data: listingId, error } = await supabase.rpc(
      "create_product_listing_draft",
      {
        p_spare_part_id: payload.sparePartId,
        p_title: payload.title,
        p_description: payload.description,
        p_oem_part_number: payload.oemPartNumber,
        p_condition: payload.condition,
        p_price: payload.price,
        p_currency: payload.currency,
        p_quantity: payload.quantity,
        p_is_negotiable: payload.isNegotiable,
        p_motorcycle_model_ids: payload.motorcycleModelIds,
      },
    );

    if (error) {
      console.error("Create listing draft failed:", error);
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ listingId }, { status: 201 });
  } catch (error) {
    if (error?.name === "ZodError") {
      return Response.json(
        { error: "Invalid listing data", issues: error.issues },
        { status: 400 },
      );
    }

    console.error("POST /api/listings failed:", error);
    return Response.json(
      { error: "Unable to create listing draft" },
      { status: 500 },
    );
  }
}
