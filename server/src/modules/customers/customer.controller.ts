import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    createCustomerSchema,
    customerIdSchema,
    customerListQuerySchema,
    followUpSchema,
    updateCustomerSchema
} from "./customer.schema.js";
import {
    createCustomer,
    createFollowUp,
    getCustomerById,
    listCustomers,
    updateCustomer
} from "./customer.service.js";

export const createCustomerController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = createCustomerSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid customer data",
            errors: result.error.flatten()
        });
        return;
    }

    try {
        const customer = await createCustomer(result.data);

        res.status(201).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error("Create customer failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create customer"
        });
    }
};

export const listCustomersController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = customerListQuerySchema.safeParse(req.query);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid customer filters",
            errors: result.error.flatten()
        });
        return;
    }

    try {
        const customers = await listCustomers(result.data);

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error("List customers failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
};

export const getCustomerController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const result = customerIdSchema.safeParse(req.params);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid customer ID"
        });
        return;
    }

    try {
        const customer = await getCustomerById(result.data.id);

        if (!customer) {
            res.status(404).json({
                success: false,
                message: "Customer not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error("Get customer failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer"
        });
    }
};

export const updateCustomerController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const params = customerIdSchema.safeParse(req.params);
    const body = updateCustomerSchema.safeParse(req.body);

    if (!params.success || !body.success) {
        res.status(400).json({
            success: false,
            message: "Invalid customer data"
        });
        return;
    }

    try {
        const customer = await updateCustomer(
            params.data.id,
            body.data
        );

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error("Update customer failed:", error);

        res.status(404).json({
            success: false,
            message: "Customer not found"
        });
    }
};

export const createFollowUpController = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const params = customerIdSchema.safeParse(req.params);
    const body = followUpSchema.safeParse(req.body);

    if (!params.success || !body.success) {
        res.status(400).json({
            success: false,
            message: "Invalid follow-up data"
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
        const followUp = await createFollowUp(
            params.data.id,
            req.user.userId,
            body.data
        );

        res.status(201).json({
            success: true,
            data: followUp
        });
    } catch (error) {
        console.error("Create follow-up failed:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create follow-up"
        });
    }
};