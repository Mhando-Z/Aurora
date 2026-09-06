import { z } from "zod";

export const addToCartSchema = z.object({
  listingId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const removeCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
});

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["cash_on_delivery", "online"]),
  customerNote: z.string().trim().max(500).optional().nullable(),
  shippingAddress: z.object({
    full_name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(30),
    region: z.string().trim().min(2).max(100),
    district: z.string().trim().min(2).max(100),
    address_line: z.string().trim().min(3).max(250),
    landmark: z.string().trim().max(180).optional().nullable(),
  }),
});

export const sellerStatusSchema = z.object({
  status: z.enum(["confirmed", "processing", "shipped", "delivered"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});
