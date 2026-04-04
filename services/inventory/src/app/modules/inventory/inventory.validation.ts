import { z } from "zod";

// Schema with body wrapper
export const InventoryCreateSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  quantity: z.number().int().optional().default(0),
});

// Type only for body
export type IInventoryCreate = z.infer<typeof InventoryCreateSchema>;

// Export validation
export const InventoryValidation = {
  InventoryCreateSchema,
};
