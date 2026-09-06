import { createClient } from "@/lib/supabase/server";
import { deleteSanityAsset, uploadProductImage } from "@/lib/sanity/server";
import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES,
} from "@/lib/validation/listing";

export const runtime = "nodejs";

export async function POST(request, { params }) {
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
    .select("id,seller_id,title,status")
    .eq("id", id)
    .eq("seller_id", user.id)
    .single();

  if (listingError || !listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("images")
    .filter((item) => item && typeof item.arrayBuffer === "function");

  const { count: existingCount, error: countError } = await supabase
    .from("product_listing_images")
    .select("*", { count: "exact", head: true })
    .eq("product_listing_id", id);

  if (countError) {
    return Response.json({ error: countError.message }, { status: 400 });
  }

  if (!files.length) {
    return Response.json(
      { error: "Select at least one image" },
      { status: 400 },
    );
  }

  if ((existingCount ?? 0) + files.length > MAX_PRODUCT_IMAGES) {
    return Response.json(
      { error: `A listing can contain at most ${MAX_PRODUCT_IMAGES} images` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
      return Response.json(
        { error: `${file.name} is not a supported image type` },
        { status: 400 },
      );
    }

    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      return Response.json(
        { error: `${file.name} exceeds the 8 MB image limit` },
        { status: 400 },
      );
    }
  }

  const uploaded = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    let sanityAsset = null;

    try {
      sanityAsset = await uploadProductImage(file);

      const sortOrder = (existingCount ?? 0) + index;
      const isPrimary = (existingCount ?? 0) === 0 && index === 0;

      const { data: imageRow, error: imageError } = await supabase
        .from("product_listing_images")
        .insert({
          product_listing_id: id,
          sanity_asset_id: sanityAsset.sanityAssetId,
          image_url: sanityAsset.imageUrl,
          original_filename: file.name,
          width: sanityAsset.width,
          height: sanityAsset.height,
          alt_text: `${listing.title} product image ${sortOrder + 1}`,
          sort_order: sortOrder,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (imageError) {
        await deleteSanityAsset(sanityAsset.sanityAssetId).catch(() => {});
        throw imageError;
      }

      uploaded.push(imageRow);
    } catch (error) {
      console.error(`Image upload failed for ${file.name}:`, error);

      return Response.json(
        {
          error: `Image upload stopped at ${file.name}`,
          detail: error?.message || "Unknown image upload error",
          listingId: id,
          uploaded,
          draftPreserved: true,
        },
        { status: 500 },
      );
    }
  }

  return Response.json({ listingId: id, images: uploaded });
}
