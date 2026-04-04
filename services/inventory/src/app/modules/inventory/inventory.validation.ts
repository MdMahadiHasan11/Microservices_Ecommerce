import { ActionType } from "@prisma/client";
import { z } from "zod";

// Schema with body wrapper
const InventoryCreateSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  quantity: z.number().int().optional().default(0),
});

const InventoryUpdateSchema = z.object({
  quantity: z.number().int(),
  actionType: z.nativeEnum(ActionType),
});

// Type only for body
export type IInventoryCreate = z.infer<typeof InventoryCreateSchema>;
export type IInventoryUpdate = z.infer<typeof InventoryUpdateSchema>;

// Export validation
export const InventoryValidation = {
  InventoryCreateSchema,
  InventoryUpdateSchema,
};
