import { z } from "zod";

// Schema with body wrapper
const CartItemSchema = z.object({
  productId: z.string(),
  inventoryId: z.string(),
  quantity: z.number(),
});

// Type only for body
export type ICartItem = z.infer<typeof CartItemSchema>;

// Export validation
export const CartValidation = {
  CartItemSchema,
};
