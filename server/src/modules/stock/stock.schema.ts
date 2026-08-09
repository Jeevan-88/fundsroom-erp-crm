import { z } from "zod";

export const stockMovementSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    movementType: z.enum(["IN", "OUT"]),
    reason: z.string().trim().min(1)
});

export type StockMovementInput = z.infer<
    typeof stockMovementSchema
>;