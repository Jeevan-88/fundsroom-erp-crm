import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    createProductSchema,
    productIdSchema,
    productQuerySchema,
    updateProductSchema
} from "./product.schema.js";
import {
    createProduct,
    getProductById,
    listProducts,
    updateProduct
} from "./product.service.js";

export const createProductController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = createProductSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid product data",
            errors: result.error.flatten()
        });
        return;
    }

    try {
        const product = await createProduct(result.data);

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "P2002"
        ) {
            res.status(409).json({
                success: false,
                message: "SKU already exists"
            });
            return;
        }

        console.error("Create product failed:", error);

        res.status(409).json({
            success: false,
            message: "Unable to create product"
        });
    }
};

export const listProductsController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = productQuerySchema.safeParse(req.query);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid product filters"
        });
        return;
    }

    try {
        const products = await listProducts(result.data);

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error("List products failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};

export const getProductController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = productIdSchema.safeParse(req.params);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid product ID"
        });
        return;
    }

    try {
        const product = await getProductById(result.data.id);

        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error("Get product failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};

export const updateProductController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const params = productIdSchema.safeParse(req.params);
    const body = updateProductSchema.safeParse(req.body);

    if (!params.success || !body.success) {
        res.status(400).json({
            success: false,
            message: "Invalid product data"
        });
        return;
    }

    try {
        const product = await updateProduct(
            params.data.id,
            body.data
        );

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "P2002"
        ) {
            res.status(409).json({
                success: false,
                message: "SKU already exists"
            });
            return;
        }

        res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }
};