import { z } from "zod";

export const challanItemSchema = z.object({
    productId: z.string().uuid("Invalid product ID"),
    quantity: z.coerce.number().int().positive("Quantity must be greater than zero")
});

export const challanItemsSchema = z.array(challanItemSchema).min(1, "At least one product is required");

export const createChallanSchema = z.object({
    customerId: z.string().uuid("Invalid customer ID"),
    items: challanItemsSchema
});

export const updateChallanSchema = createChallanSchema;

export const challanIdSchema = z.object({
    id: z.string().uuid("Invalid challan ID")
});

export type ChallanItemInput = z.infer<typeof challanItemSchema>;
export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;