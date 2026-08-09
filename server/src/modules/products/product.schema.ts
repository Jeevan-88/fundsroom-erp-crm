import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().trim().min(1, "Product name is required"),
    sku: z.string().trim().min(1, "SKU is required"),
    category: z.string().trim().min(1, "Category is required"),
    unitPrice: z.coerce.number().nonnegative(),
    currentStock: z.coerce.number().int().nonnegative().default(0),
    minimumStock: z.coerce.number().int().nonnegative().default(0),
    warehouseLocation: z.string().trim().min(1, "Warehouse location is required")
});

export const updateProductSchema = createProductSchema
    .omit({ currentStock: true })
    .partial();

export const productIdSchema = z.object({
    id: z.string().uuid("Invalid product ID")
});

export const productQuerySchema = z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    lowStock: z.coerce.boolean().optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;