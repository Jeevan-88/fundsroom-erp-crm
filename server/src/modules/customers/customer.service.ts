import prisma from "../../lib/prisma.js";
import type {
    CreateCustomerInput,
    CustomerListQuery,
    FollowUpInput,
    UpdateCustomerInput
} from "./customer.schema.js";

export const createCustomer = async (
    input: CreateCustomerInput
) => {
    return prisma.customer.create({
        data: {
            customerName: input.customerName,
            mobile: input.mobile,
            email: input.email,
            businessName: input.businessName,
            gstNumber: input.gstNumber,
            customerType: input.customerType,
            address: input.address,
            status: input.status ?? "LEAD",
            followUpDate: input.followUpDate,
            notes: input.notes
        }
    });
};

export const listCustomers = async (
    query: CustomerListQuery
) => {
    const search = query.search;

    return prisma.customer.findMany({
        where: {
            status: query.status,
            customerType: query.customerType,
            ...(search
                ? {
                    OR: [
                        {
                            customerName: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            mobile: {
                                contains: search
                            }
                        },
                        {
                            businessName: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            email: {
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
};

export const getCustomerById = async (
    customerId: string
) => {
    return prisma.customer.findUnique({
        where: {
            id: customerId
        },
        include: {
            followUps: {
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            }
        }
    });
};

export const updateCustomer = async (
    customerId: string,
    input: UpdateCustomerInput
) => {
    return prisma.customer.update({
        where: {
            id: customerId
        },
        data: input
    });
};

export const createFollowUp = async (
    customerId: string,
    createdById: string,
    input: FollowUpInput
) => {
    return prisma.followUp.create({
        data: {
            customerId,
            createdById,
            note: input.note,
            followUpDate: input.followUpDate
        }
    });
};