import { createClient } from "next-sanity";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const sanityServerClient = createClient({
  projectId: required("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  dataset: required("NEXT_PUBLIC_SANITY_DATASET"),
  apiVersion: "2026-09-01",
  token: required("SANITY_API_TOKEN"),
  useCdn: false,
});

export async function uploadProductImage(file) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const asset = await sanityServerClient.assets.upload("image", buffer, {
    filename: file.name || "aurora-product-image",
  });

  return {
    sanityAssetId: asset._id,
    imageUrl: asset.url,
    width: asset.metadata?.dimensions?.width ?? null,
    height: asset.metadata?.dimensions?.height ?? null,
  };
}

export async function deleteSanityAsset(assetId) {
  if (!assetId) return;
  await sanityServerClient.delete(assetId);
}
