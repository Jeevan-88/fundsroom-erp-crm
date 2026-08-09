import prisma from "../../lib/prisma.js";
import type { StockMovementInput } from "./stock.schema.js";

export const createStockMovement = async (
    input: StockMovementInput,
    userId: string
) => {
    return prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: { id: input.productId }
        });

        if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
        }

        const newStock =
            input.movementType === "IN"
                ? product.currentStock + input.quantity
                : product.currentStock - input.quantity;

        if (newStock < 0) {
            throw new Error("INSUFFICIENT_STOCK");
        }

        const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: {
                currentStock: newStock
            }
        });

        const movement = await tx.stockMovement.create({
            data: {
                productId: product.id,
                quantity: input.quantity,
                movementType: input.movementType,
                reason: input.reason,
                createdById: userId
            }
        });

        return {
            product: updatedProduct,
            movement
        };
    });
};

export const listStockMovements = async () => {
    return prisma.stockMovement.findMany({
        include: {
            product: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};