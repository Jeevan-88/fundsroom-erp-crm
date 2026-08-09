import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { stockMovementSchema } from "./stock.schema.js";
import {
    createStockMovement,
    listStockMovements
} from "./stock.service.js";

export const createStockMovementController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = stockMovementSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid stock movement",
            errors: result.error.flatten()
        });
        return;
    }

    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Authentication required"
        });
        return;
    }

    try {
        const resultData = await createStockMovement(
            result.data,
            req.user.userId
        );

        res.status(201).json({
            success: true,
            data: resultData
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "INSUFFICIENT_STOCK") {
                res.status(409).json({
                    success: false,
                    message: "Insufficient stock"
                });
                return;
            }

            if (error.message === "PRODUCT_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            message: "Failed to create stock movement"
        });
    }
};

export const listStockMovementsController = async (
    _req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const movements = await listStockMovements();

    res.status(200).json({
        success: true,
        data: movements
    });
};