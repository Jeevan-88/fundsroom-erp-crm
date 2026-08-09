import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import app from "../app.js";
import prisma, { disconnectPrisma } from "../lib/prisma.js";

type JsonResponse = {
    success: boolean;
    data?: any;
    message?: string;
    errors?: unknown;
};

const baseLabel = `Smoke ${Date.now()}`;

const makeUnique = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

const toJson = async (response: Response): Promise<JsonResponse> => {
    return response.json() as Promise<JsonResponse>;
};

const main = async (): Promise<void> => {
    const server = app.listen(0);

    const address = server.address();

    if (!address || typeof address === "string") {
        throw new Error("Failed to bind smoke test server");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const createdCustomerIds: string[] = [];
    const createdProductIds: string[] = [];
    const createdChallanIds: string[] = [];
    const cleanupStockMovementProductIds: string[] = [];

    const request = async (
        path: string,
        options: {
            method?: string;
            token?: string;
            body?: unknown;
        } = {}
    ) => {
        const headers: Record<string, string> = {};

        if (options.token) {
            headers.Authorization = `Bearer ${options.token}`;
        }

        let body: string | undefined;

        if (options.body !== undefined) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(options.body);
        }

        const response = await fetch(`${baseUrl}${path}`, {
            method: options.method ?? "GET",
            headers,
            body
        });

        const parsed = await toJson(response);

        return {
            status: response.status,
            body: parsed
        };
    };

    const login = async (email: string, password: string): Promise<string> => {
        const response = await request("/api/auth/login", {
            method: "POST",
            body: { email, password }
        });

        assert.equal(response.status, 200, `Login failed for ${email}`);
        assert.equal(response.body.success, true);

        return response.body.data.token as string;
    };

    const adminToken = await login("admin@fundsroom.local", "Admin@12345");
    const salesToken = await login("sales@fundsroom.local", "Sales@12345");
    const warehouseToken = await login("warehouse@fundsroom.local", "Warehouse@12345");

    const run = async (name: string, fn: () => Promise<void>) => {
        process.stdout.write(`Running ${name}...\n`);
        await fn();
    };

    try {
        await run("authentication", async () => {
            const validLogin = await request("/api/auth/login", {
                method: "POST",
                body: { email: "admin@fundsroom.local", password: "Admin@12345" }
            });

            assert.equal(validLogin.status, 200);
            assert.equal(validLogin.body.success, true);

            const invalidPassword = await request("/api/auth/login", {
                method: "POST",
                body: { email: "admin@fundsroom.local", password: "wrong" }
            });

            assert.equal(invalidPassword.status, 401);
            assert.equal(invalidPassword.body.success, false);

            const missingToken = await request("/api/auth/me");
            assert.equal(missingToken.status, 401);

            const invalidToken = await request("/api/auth/me", {
                token: "not-a-real-token"
            });
            assert.equal(invalidToken.status, 401);
        });

        await run("authorization", async () => {
            const denied = await request("/api/products", {
                method: "POST",
                token: salesToken,
                body: {
                    name: "Denied Product",
                    sku: makeUnique("DENIED-SKU"),
                    category: "Test",
                    unitPrice: 10,
                    currentStock: 0,
                    minimumStock: 0,
                    warehouseLocation: "A1"
                }
            });

            assert.equal(denied.status, 403);

            const allowed = await request("/api/products", {
                method: "POST",
                token: adminToken,
                body: {
                    name: `${baseLabel} Product CRUD`,
                    sku: makeUnique("CRUD-SKU"),
                    category: "Fasteners",
                    unitPrice: 125.5,
                    currentStock: 3,
                    minimumStock: 1,
                    warehouseLocation: "Rack 1"
                }
            });

            assert.equal(allowed.status, 201);
            createdProductIds.push(allowed.body.data.id);
        });

        await run("customer crm", async () => {
            const uniqueName = `${baseLabel} Customer`;
            const createCustomer = await request("/api/customers", {
                method: "POST",
                token: salesToken,
                body: {
                    customerName: uniqueName,
                    mobile: `9${Date.now().toString().slice(-9)}`,
                    email: `${makeUnique("customer")}@example.com`,
                    businessName: `${baseLabel} Trading`,
                    customerType: "WHOLESALE",
                    status: "ACTIVE",
                    address: "Unit 12",
                    notes: "Initial lead"
                }
            });

            assert.equal(createCustomer.status, 201);
            const customerId = createCustomer.body.data.id as string;
            createdCustomerIds.push(customerId);

            const listCustomers = await request(`/api/customers?search=${encodeURIComponent(uniqueName)}`, {
                token: salesToken
            });

            assert.equal(listCustomers.status, 200);
            assert.ok(
                listCustomers.body.data.some((customer: { id: string }) => customer.id === customerId)
            );

            const getCustomer = await request(`/api/customers/${customerId}`, {
                token: salesToken
            });

            assert.equal(getCustomer.status, 200);
            assert.equal(getCustomer.body.data.id, customerId);

            const updateCustomer = await request(`/api/customers/${customerId}`, {
                method: "PUT",
                token: salesToken,
                body: {
                    customerName: `${uniqueName} Updated`,
                    mobile: `8${Date.now().toString().slice(-9)}`,
                    customerType: "DISTRIBUTOR",
                    status: "ACTIVE"
                }
            });

            assert.equal(updateCustomer.status, 200);
            assert.equal(updateCustomer.body.data.customerName, `${uniqueName} Updated`);

            const followUp = await request(`/api/customers/${customerId}/followups`, {
                method: "POST",
                token: salesToken,
                body: {
                    note: "Call back tomorrow",
                    followUpDate: new Date().toISOString()
                }
            });

            assert.equal(followUp.status, 201);

            const followUpDetails = await request(`/api/customers/${customerId}`, {
                token: salesToken
            });

            assert.equal(followUpDetails.body.data.followUps.length, 1);
        });

        await run("product management", async () => {
            const uniqueSku = makeUnique("PROD-SKU");
            const createProduct = await request("/api/products", {
                method: "POST",
                token: adminToken,
                body: {
                    name: `${baseLabel} Product Masters`,
                    sku: uniqueSku,
                    category: "Packaging",
                    unitPrice: 49.99,
                    currentStock: 4,
                    minimumStock: 2,
                    warehouseLocation: "Bay 2"
                }
            });

            assert.equal(createProduct.status, 201);
            const productId = createProduct.body.data.id as string;
            createdProductIds.push(productId);

            const duplicateSku = await request("/api/products", {
                method: "POST",
                token: adminToken,
                body: {
                    name: `${baseLabel} Product Duplicate`,
                    sku: uniqueSku,
                    category: "Packaging",
                    unitPrice: 50,
                    currentStock: 1,
                    minimumStock: 1,
                    warehouseLocation: "Bay 2"
                }
            });

            assert.equal(duplicateSku.status, 409);

            const listProducts = await request(`/api/products?search=${encodeURIComponent(uniqueSku)}`, {
                token: adminToken
            });

            assert.equal(listProducts.status, 200);
            assert.ok(listProducts.body.data.some((product: { id: string }) => product.id === productId));

            const updateProduct = await request(`/api/products/${productId}`, {
                method: "PUT",
                token: adminToken,
                body: {
                    name: `${baseLabel} Product Masters Updated`,
                    category: "Packaging Updated",
                    unitPrice: 59.99,
                    minimumStock: 3,
                    warehouseLocation: "Bay 3"
                }
            });

            assert.equal(updateProduct.status, 200);
            assert.equal(updateProduct.body.data.name, `${baseLabel} Product Masters Updated`);

            const getProduct = await request(`/api/products/${productId}`, {
                token: adminToken
            });

            assert.equal(getProduct.status, 200);
            assert.equal(getProduct.body.data.isLowStock, false);
        });

        await run("stock movements", async () => {
            const productName = `${baseLabel} Inventory Item`;
            const createProduct = await request("/api/products", {
                method: "POST",
                token: adminToken,
                body: {
                    name: productName,
                    sku: makeUnique("INV-SKU"),
                    category: "Inventory",
                    unitPrice: 100,
                    currentStock: 0,
                    minimumStock: 5,
                    warehouseLocation: "Warehouse Test"
                }
            });

            assert.equal(createProduct.status, 201);
            const productId = createProduct.body.data.id as string;
            createdProductIds.push(productId);
            cleanupStockMovementProductIds.push(productId);

            const stockIn = await request("/api/stock/movements", {
                method: "POST",
                token: warehouseToken,
                body: {
                    productId,
                    quantity: 10,
                    movementType: "IN",
                    reason: "Initial stock"
                }
            });

            assert.equal(stockIn.status, 201);
            assert.equal(stockIn.body.data.product.currentStock, 10);

            const stockOut = await request("/api/stock/movements", {
                method: "POST",
                token: warehouseToken,
                body: {
                    productId,
                    quantity: 4,
                    movementType: "OUT",
                    reason: "Pick order"
                }
            });

            assert.equal(stockOut.status, 201);
            assert.equal(stockOut.body.data.product.currentStock, 6);

            const failedOut = await request("/api/stock/movements", {
                method: "POST",
                token: warehouseToken,
                body: {
                    productId,
                    quantity: 999,
                    movementType: "OUT",
                    reason: "Should fail"
                }
            });

            assert.equal(failedOut.status, 409);

            const currentProduct = await request(`/api/products/${productId}`, {
                token: adminToken
            });

            assert.equal(currentProduct.body.data.currentStock, 6);
        });

        await run("challans", async () => {
            const customerResponse = await request("/api/customers", {
                method: "POST",
                token: salesToken,
                body: {
                    customerName: `${baseLabel} Challan Customer`,
                    mobile: `7${Date.now().toString().slice(-9)}`,
                    customerType: "RETAIL",
                    status: "ACTIVE"
                }
            });

            assert.equal(customerResponse.status, 201);
            const customerId = customerResponse.body.data.id as string;
            createdCustomerIds.push(customerId);

            const inventoryProduct = await prisma.product.findFirst({
                where: {
                    name: `${baseLabel} Inventory Item`
                }
            });

            assert.ok(inventoryProduct);

            const draftResponse = await request("/api/challans", {
                method: "POST",
                token: salesToken,
                body: {
                    customerId,
                    items: [
                        {
                            productId: inventoryProduct.id,
                            quantity: 3
                        }
                    ]
                }
            });

            assert.equal(draftResponse.status, 201);
            assert.equal(draftResponse.body.data.status, "DRAFT");
            assert.equal(draftResponse.body.data.totalQuantity, 3);
            assert.equal(draftResponse.body.data.items[0].productNameSnapshot, inventoryProduct.name);
            assert.equal(draftResponse.body.data.items[0].skuSnapshot, inventoryProduct.sku);

            const draftId = draftResponse.body.data.id as string;
            createdChallanIds.push(draftId);

            const updateDraft = await request(`/api/challans/${draftId}`, {
                method: "PUT",
                token: salesToken,
                body: {
                    customerId,
                    items: [
                        {
                            productId: inventoryProduct.id,
                            quantity: 2
                        }
                    ]
                }
            });

            assert.equal(updateDraft.status, 200);
            assert.equal(updateDraft.body.data.totalQuantity, 2);

            const listChallansResponse = await request("/api/challans", {
                token: salesToken
            });

            assert.equal(listChallansResponse.status, 200);
            assert.ok(listChallansResponse.body.data.some((challan: { id: string }) => challan.id === draftId));

            const getChallanResponse = await request(`/api/challans/${draftId}`, {
                token: salesToken
            });

            assert.equal(getChallanResponse.status, 200);

            const movementsBeforeConfirm = await request("/api/stock/movements", {
                token: adminToken
            });

            const stockBeforeConfirm = (await request(`/api/products/${inventoryProduct.id}`, {
                token: adminToken
            })).body.data.currentStock as number;

            const confirmResponse = await request(`/api/challans/${draftId}/confirm`, {
                method: "POST",
                token: salesToken
            });

            assert.equal(confirmResponse.status, 200);
            assert.equal(confirmResponse.body.data.status, "CONFIRMED");

            const afterConfirm = await request(`/api/products/${inventoryProduct.id}`, {
                token: adminToken
            });

            assert.equal(afterConfirm.body.data.currentStock, stockBeforeConfirm - 2);

            const movementsAfterConfirm = await request("/api/stock/movements", {
                token: adminToken
            });

            const challanMovementCount = movementsAfterConfirm.body.data.filter(
                (movement: { reason: string }) => movement.reason === `Challan ${confirmResponse.body.data.challanNumber}`
            ).length;

            assert.equal(challanMovementCount, 1);
            assert.ok(movementsAfterConfirm.body.data.length > movementsBeforeConfirm.body.data.length);

            const confirmAgain = await request(`/api/challans/${draftId}/confirm`, {
                method: "POST",
                token: salesToken
            });

            assert.equal(confirmAgain.status, 409);

            const updateConfirmed = await request(`/api/challans/${draftId}`, {
                method: "PUT",
                token: salesToken,
                body: {
                    customerId,
                    items: [
                        {
                            productId: inventoryProduct.id,
                            quantity: 1
                        }
                    ]
                }
            });

            assert.equal(updateConfirmed.status, 409);

            const snapshotUpdate = await request(`/api/products/${inventoryProduct.id}`, {
                method: "PUT",
                token: adminToken,
                body: {
                    name: `${inventoryProduct.name} Revised`,
                    sku: `${inventoryProduct.sku}-REV`,
                    category: inventoryProduct.category,
                    unitPrice: 111,
                    minimumStock: inventoryProduct.minimumStock,
                    warehouseLocation: inventoryProduct.warehouseLocation
                }
            });

            assert.equal(snapshotUpdate.status, 200);

            const challanAfterProductChange = await request(`/api/challans/${draftId}`, {
                token: salesToken
            });

            assert.equal(
                challanAfterProductChange.body.data.items[0].productNameSnapshot,
                inventoryProduct.name
            );
            assert.equal(challanAfterProductChange.body.data.items[0].skuSnapshot, inventoryProduct.sku);

            const failedDraft = await request("/api/challans", {
                method: "POST",
                token: salesToken,
                body: {
                    customerId,
                    items: [
                        {
                            productId: inventoryProduct.id,
                            quantity: 999
                        }
                    ]
                }
            });

            assert.equal(failedDraft.status, 201);
            const failedDraftId = failedDraft.body.data.id as string;
            createdChallanIds.push(failedDraftId);

            const failedConfirm = await request(`/api/challans/${failedDraftId}/confirm`, {
                method: "POST",
                token: salesToken
            });

            assert.equal(failedConfirm.status, 409);

            const stockAfterFailedConfirm = await request(`/api/products/${inventoryProduct.id}`, {
                token: adminToken
            });

            assert.equal(stockAfterFailedConfirm.body.data.currentStock, afterConfirm.body.data.currentStock);

            const cancelDraft = await request("/api/challans", {
                method: "POST",
                token: salesToken,
                body: {
                    customerId,
                    items: [
                        {
                            productId: inventoryProduct.id,
                            quantity: 1
                        }
                    ]
                }
            });

            assert.equal(cancelDraft.status, 201);
            const cancelDraftId = cancelDraft.body.data.id as string;
            createdChallanIds.push(cancelDraftId);

            const cancelResponse = await request(`/api/challans/${cancelDraftId}/cancel`, {
                method: "POST",
                token: salesToken
            });

            assert.equal(cancelResponse.status, 200);
            assert.equal(cancelResponse.body.data.status, "CANCELLED");
        });

        const lowStockCheck = await request("/api/products?lowStock=true", {
            token: adminToken
        });

        assert.equal(lowStockCheck.status, 200);
        assert.ok(
            lowStockCheck.body.data.some((product: { id: string }) =>
                createdProductIds.includes(product.id)
            )
        );

        process.stdout.write("All backend smoke tests passed.\n");
    } finally {
        if (cleanupStockMovementProductIds.length > 0) {
            await prisma.stockMovement.deleteMany({
                where: {
                    productId: {
                        in: cleanupStockMovementProductIds
                    }
                }
            });
        }

        if (createdChallanIds.length > 0) {
            await prisma.challan.deleteMany({
                where: {
                    id: {
                        in: createdChallanIds
                    }
                }
            });
        }

        if (createdProductIds.length > 0) {
            await prisma.product.deleteMany({
                where: {
                    id: {
                        in: createdProductIds
                    }
                }
            });
        }

        if (createdCustomerIds.length > 0) {
            await prisma.customer.deleteMany({
                where: {
                    id: {
                        in: createdCustomerIds
                    }
                }
            });
        }

        server.close();
        await disconnectPrisma();
    }
};

main().catch((error) => {
    console.error("Smoke tests failed:", error);
    process.exitCode = 1;
});