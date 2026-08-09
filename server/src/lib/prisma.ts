import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
    connectionString
});

const prisma = new PrismaClient({
    adapter
});

export const disconnectPrisma = async (): Promise<void> => {
    await prisma.$disconnect();
};

export default prisma;