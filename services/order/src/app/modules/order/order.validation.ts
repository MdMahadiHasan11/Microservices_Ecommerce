import { z } from "zod";

const OrderCreateSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  cartSessionId: z.string(),
});

const CartItemSchema = z.object({
  productId: z.string(),
  inventoryId: z.string(),
  quantity: z.number(),
});

// Type only for body
export type IOrder = z.infer<typeof OrderCreateSchema>;
export type ICartItem = z.infer<typeof CartItemSchema>;

// Export validation
export const OrderValidation = { OrderCreateSchema, CartItemSchema };
