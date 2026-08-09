import { z } from "zod";

export const customerTypeSchema = z.enum([
    "RETAIL",
    "WHOLESALE",
    "DISTRIBUTOR"
]);

export const customerStatusSchema = z.enum([
    "LEAD",
    "ACTIVE",
    "INACTIVE"
]);

export const createCustomerSchema = z.object({
    customerName: z.string().trim().min(1, "Customer name is required"),
    mobile: z.string().trim().min(5, "Mobile number is required"),
    email: z.string().email("Invalid email address").optional(),
    businessName: z.string().trim().optional(),
    gstNumber: z.string().trim().optional(),
    customerType: customerTypeSchema,
    address: z.string().trim().optional(),
    status: customerStatusSchema.optional(),
    followUpDate: z.coerce.date().optional(),
    notes: z.string().trim().optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerIdSchema = z.object({
    id: z.string().uuid("Invalid customer ID")
});

export const customerListQuerySchema = z.object({
    search: z.string().trim().optional(),
    status: customerStatusSchema.optional(),
    customerType: customerTypeSchema.optional()
});

export const followUpSchema = z.object({
    note: z.string().trim().min(1, "Follow-up note is required"),
    followUpDate: z.coerce.date()
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;