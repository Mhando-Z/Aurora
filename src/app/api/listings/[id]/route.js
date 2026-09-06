import { createClient } from "@/lib/supabase/server";
import { deleteSanityAsset } from "@/lib/sanity/server";

export const runtime = "nodejs";

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("product_listings")
    .select("id,seller_id")
    .eq("id", id)
    .eq("seller_id", user.id)
    .single();

  if (listingError || !listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: images, error: imagesError } = await supabase
    .from("product_listing_images")
    .select("sanity_asset_id")
    .eq("product_listing_id", id);

  if (imagesError) {
    return Response.json({ error: imagesError.message }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("product_listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id);

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 400 });
  }

  // Database ownership is already removed. Sanity cleanup is best-effort so
  // a transient Sanity error never leaves a database row pointing to a deleted image.
  const failedAssets = [];
  for (const image of images ?? []) {
    try {
      await deleteSanityAsset(image.sanity_asset_id);
    } catch {
      failedAssets.push(image.sanity_asset_id);
    }
  }

  return Response.json({
    deleted: true,
    orphanedSanityAssets: failedAssets,
  });
}
