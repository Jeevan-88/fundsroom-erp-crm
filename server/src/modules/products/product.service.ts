import prisma from "../../lib/prisma.js";
import type {
    CreateProductInput,
    ProductQuery,
    UpdateProductInput
} from "./product.schema.js";

export const createProduct = async (input: CreateProductInput) => {
    return prisma.product.create({
        data: input
    });
};

export const listProducts = async (query: ProductQuery) => {
    const search = query.search;

    const products = await prisma.product.findMany({
        where: {
            category: query.category,
            ...(search
                ? {
                    OR: [
                        {
                            name: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            sku: {
                                contains: search,
                                mode: "insensitive"
                            }
                        }
                    ]
                }
                : {})
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    const filteredProducts = query.lowStock
        ? products.filter((product) => product.currentStock <= product.minimumStock)
        : products;

    return filteredProducts.map((product) => ({
        ...product,
        isLowStock: product.currentStock <= product.minimumStock
    }));
};

export const getProductById = async (id: string) => {
    const product = await prisma.product.findUnique({
        where: { id }
    });

    if (!product) {
        return null;
    }

    return {
        ...product,
        isLowStock: product.currentStock <= product.minimumStock
    };
};

export const updateProduct = async (
    id: string,
    input: UpdateProductInput
) => {
    const product = await prisma.product.update({
        where: { id },
        data: input
    });

    return {
        ...product,
        isLowStock: product.currentStock <= product.minimumStock
    };
};