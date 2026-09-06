import { z } from "zod";

export const listingDraftSchema = z.object({
  sparePartId: z.coerce.number().int().positive(),
  motorcycleModelIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Select at least one compatible motorcycle")
    .max(20, "A listing can contain at most 20 motorcycle fitments"),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(5000).optional().default(""),
  oemPartNumber: z.string().trim().max(120).optional().default(""),
  condition: z.enum(["new", "used", "refurbished"]),
  price: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default("TZS"),
  quantity: z.coerce.number().int().min(1).max(100000),
  isNegotiable: z.boolean().optional().default(false),
});

export const ALLOWED_PRODUCT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_PRODUCT_IMAGES = 6;
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;
