import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    challanIdSchema,
    createChallanSchema,
    updateChallanSchema
} from "./challan.schema.js";
import {
    cancelChallan,
    confirmChallan,
    createChallan,
    getChallanById,
    listChallans,
    updateChallan
} from "./challan.service.js";

export const listChallansController = async (
    _req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const challans = await listChallans();

        res.status(200).json({
            success: true,
            data: challans
        });
    } catch (error) {
        console.error("List challans failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch challans"
        });
    }
};

export const createChallanController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = createChallanSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid challan data",
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
        const challan = await createChallan(result.data, req.user.userId);

        res.status(201).json({
            success: true,
            data: challan
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "CUSTOMER_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Customer not found"
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

        console.error("Create challan failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create challan"
        });
    }
};

export const getChallanController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = challanIdSchema.safeParse(req.params);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid challan ID"
        });
        return;
    }

    try {
        const challan = await getChallanById(result.data.id);

        if (!challan) {
            res.status(404).json({
                success: false,
                message: "Challan not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: challan
        });
    } catch (error) {
        console.error("Get challan failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch challan"
        });
    }
};

export const updateChallanController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const params = challanIdSchema.safeParse(req.params);
    const body = updateChallanSchema.safeParse(req.body);

    if (!params.success || !body.success) {
        res.status(400).json({
            success: false,
            message: "Invalid challan data"
        });
        return;
    }

    try {
        const challan = await updateChallan(params.data.id, body.data);

        if (!challan) {
            res.status(404).json({
                success: false,
                message: "Challan not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: challan
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "CHALLAN_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Challan not found"
                });
                return;
            }

            if (error.message === "CUSTOMER_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Customer not found"
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

            if (error.message === "CHALLAN_NOT_DRAFT") {
                res.status(409).json({
                    success: false,
                    message: "Only draft challans can be updated"
                });
                return;
            }
        }

        console.error("Update challan failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update challan"
        });
    }
};

export const confirmChallanController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = challanIdSchema.safeParse(req.params);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid challan ID"
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
        const challan = await confirmChallan(result.data.id, req.user.userId);

        if (!challan) {
            res.status(404).json({
                success: false,
                message: "Challan not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: challan
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "CHALLAN_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Challan not found"
                });
                return;
            }

            if (error.message === "CHALLAN_NOT_DRAFT") {
                res.status(409).json({
                    success: false,
                    message: "Only draft challans can be confirmed"
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

            if (error.message === "INSUFFICIENT_STOCK") {
                res.status(409).json({
                    success: false,
                    message: "Insufficient stock"
                });
                return;
            }
        }

        console.error("Confirm challan failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to confirm challan"
        });
    }
};

export const cancelChallanController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = challanIdSchema.safeParse(req.params);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid challan ID"
        });
        return;
    }

    try {
        const challan = await cancelChallan(result.data.id);

        if (!challan) {
            res.status(404).json({
                success: false,
                message: "Challan not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: challan
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "CHALLAN_NOT_FOUND") {
                res.status(404).json({
                    success: false,
                    message: "Challan not found"
                });
                return;
            }

            if (error.message === "CHALLAN_NOT_DRAFT") {
                res.status(409).json({
                    success: false,
                    message: "Only draft challans can be cancelled"
                });
                return;
            }
        }

        console.error("Cancel challan failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to cancel challan"
        });
    }
};