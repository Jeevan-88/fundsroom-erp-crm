import prisma from "../../lib/prisma.js";
import type { ChallanItemInput, CreateChallanInput, UpdateChallanInput } from "./challan.schema.js";

const aggregateItems = (items: ChallanItemInput[]) => {
    const aggregated = new Map<string, number>();

    for (const item of items) {
        aggregated.set(item.productId, (aggregated.get(item.productId) ?? 0) + item.quantity);
    }

    return Array.from(aggregated.entries()).map(([productId, quantity]) => ({
        productId,
        quantity
    }));
};

const createChallanNumber = (): string => {
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `CH-${timestamp}-${suffix}`;
};

const includeChallan = {
    customer: true,
    createdBy: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    },
    items: true
} as const;

const loadProducts = async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], productIds: string[]) => {
    const products = await tx.product.findMany({
        where: {
            id: {
                in: productIds
            }
        }
    });

    if (products.length !== productIds.length) {
        throw new Error("PRODUCT_NOT_FOUND");
    }

    return products;
};

const loadCustomer = async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], customerId: string) => {
    const customer = await tx.customer.findUnique({
        where: {
            id: customerId
        }
    });

    if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
    }

    return customer;
};

export const listChallans = async () => {
    return prisma.challan.findMany({
        include: includeChallan,
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const getChallanById = async (id: string) => {
    return prisma.challan.findUnique({
        where: { id },
        include: includeChallan
    });
};

export const createChallan = async (input: CreateChallanInput, userId: string) => {
    const items = aggregateItems(input.items);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return prisma.$transaction(async (tx) => {
        await loadCustomer(tx, input.customerId);
        const products = await loadProducts(tx, items.map((item) => item.productId));
        const productById = new Map(products.map((product) => [product.id, product]));

        return tx.challan.create({
            data: {
                challanNumber: createChallanNumber(),
                customerId: input.customerId,
                totalQuantity,
                status: "DRAFT",
                createdById: userId,
                items: {
                    create: items.map((item) => {
                        const product = productById.get(item.productId);

                        if (!product) {
                            throw new Error("PRODUCT_NOT_FOUND");
                        }

                        return {
                            productId: product.id,
                            productNameSnapshot: product.name,
                            skuSnapshot: product.sku,
                            unitPriceSnapshot: product.unitPrice,
                            quantity: item.quantity
                        };
                    })
                }
            },
            include: includeChallan
        });
    });
};

export const updateChallan = async (
    challanId: string,
    input: UpdateChallanInput
) => {
    const items = aggregateItems(input.items);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return prisma.$transaction(async (tx) => {
        const challan = await tx.challan.findUnique({
            where: { id: challanId }
        });

        if (!challan) {
            throw new Error("CHALLAN_NOT_FOUND");
        }

        if (challan.status !== "DRAFT") {
            throw new Error("CHALLAN_NOT_DRAFT");
        }

        await loadCustomer(tx, input.customerId);
        const products = await loadProducts(tx, items.map((item) => item.productId));
        const productById = new Map(products.map((product) => [product.id, product]));

        await tx.challanItem.deleteMany({
            where: {
                challanId
            }
        });

        const updated = await tx.challan.update({
            where: { id: challanId },
            data: {
                customerId: input.customerId,
                totalQuantity
            },
            include: includeChallan
        });

        await tx.challanItem.createMany({
            data: items.map((item) => {
                const product = productById.get(item.productId);

                if (!product) {
                    throw new Error("PRODUCT_NOT_FOUND");
                }

                return {
                    challanId,
                    productId: product.id,
                    productNameSnapshot: product.name,
                    skuSnapshot: product.sku,
                    unitPriceSnapshot: product.unitPrice,
                    quantity: item.quantity
                };
            })
        });

        return tx.challan.findUnique({
            where: { id: updated.id },
            include: includeChallan
        });
    });
};

export const confirmChallan = async (challanId: string, userId: string) => {
    return prisma.$transaction(async (tx) => {
        const challan = await tx.challan.findUnique({
            where: { id: challanId },
            include: {
                items: true
            }
        });

        if (!challan) {
            throw new Error("CHALLAN_NOT_FOUND");
        }

        if (challan.status !== "DRAFT") {
            throw new Error("CHALLAN_NOT_DRAFT");
        }

        const products = await loadProducts(tx, challan.items.map((item) => item.productId));
        const productById = new Map(products.map((product) => [product.id, product]));

        const confirmationClaim = await tx.challan.updateMany({
            where: {
                id: challanId,
                status: "DRAFT"
            },
            data: {
                status: "CONFIRMED"
            }
        });

        if (confirmationClaim.count === 0) {
            throw new Error("CHALLAN_NOT_DRAFT");
        }

        for (const item of challan.items) {
            const product = productById.get(item.productId);

            if (!product) {
                throw new Error("PRODUCT_NOT_FOUND");
            }

            const stockUpdate = await tx.product.updateMany({
                where: {
                    id: product.id,
                    currentStock: {
                        gte: item.quantity
                    }
                },
                data: {
                    currentStock: {
                        decrement: item.quantity
                    }
                }
            });

            if (stockUpdate.count === 0) {
                throw new Error("INSUFFICIENT_STOCK");
            }
        }

        await tx.stockMovement.createMany({
            data: challan.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                movementType: "OUT",
                reason: `Challan ${challan.challanNumber}`,
                createdById: userId
            }))
        });

        return tx.challan.findUnique({
            where: { id: challanId },
            include: includeChallan
        });
    });
};

export const cancelChallan = async (challanId: string) => {
    return prisma.$transaction(async (tx) => {
        const challan = await tx.challan.findUnique({
            where: { id: challanId }
        });

        if (!challan) {
            throw new Error("CHALLAN_NOT_FOUND");
        }

        if (challan.status !== "DRAFT") {
            throw new Error("CHALLAN_NOT_DRAFT");
        }

        return tx.challan.update({
            where: { id: challanId },
            data: {
                status: "CANCELLED"
            },
            include: includeChallan
        });
    });
};