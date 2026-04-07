import { ProductStatus } from "@prisma/client";
import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive").default(0),
  inventoryId: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional().default(ProductStatus.DRAFT),
});

export type ICreateProduct = z.infer<typeof createProductSchema>;

export const ProductUpdateSchema = createProductSchema.omit({
  sku: true,
});
// Export validation
export const ProductValidation = {
  createProductSchema,
  ProductUpdateSchema,
};
