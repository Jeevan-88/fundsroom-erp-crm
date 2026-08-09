import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

const {
    ADMIN_SEED_PASSWORD,
    SALES_SEED_PASSWORD,
    WAREHOUSE_SEED_PASSWORD,
    ACCOUNTS_SEED_PASSWORD
} = process.env;

const requiredSeedPasswords: Record<string, string | undefined> = {
    ADMIN_SEED_PASSWORD,
    SALES_SEED_PASSWORD,
    WAREHOUSE_SEED_PASSWORD,
    ACCOUNTS_SEED_PASSWORD
};

const missing = Object.entries(requiredSeedPasswords)
    .filter(([_, value]) => !value || value.trim() === "")
    .map(([key]) => key);

if (missing.length > 0) {
    console.error(`[ERROR] Missing required seed password environment variables: ${missing.join(", ")}`);
    console.error("Please set ADMIN_SEED_PASSWORD, SALES_SEED_PASSWORD, WAREHOUSE_SEED_PASSWORD, and ACCOUNTS_SEED_PASSWORD in server/.env file.");
    process.exit(1);
}

const users = [
    {
        name: "System Administrator",
        email: "admin@fundsroom.local",
        password: ADMIN_SEED_PASSWORD!,
        role: "ADMIN" as const
    },
    {
        name: "Sales User",
        email: "sales@fundsroom.local",
        password: SALES_SEED_PASSWORD!,
        role: "SALES" as const
    },
    {
        name: "Warehouse User",
        email: "warehouse@fundsroom.local",
        password: WAREHOUSE_SEED_PASSWORD!,
        role: "WAREHOUSE" as const
    },
    {
        name: "Accounts User",
        email: "accounts@fundsroom.local",
        password: ACCOUNTS_SEED_PASSWORD!,
        role: "ACCOUNTS" as const
    }
];

const main = async (): Promise<void> => {
    for (const userData of users) {
        const passwordHash = await bcrypt.hash(userData.password, 12);

        const user = await prisma.user.upsert({
            where: {
                email: userData.email
            },
            update: {
                passwordHash,
                name: userData.name,
                role: userData.role
            },
            create: {
                name: userData.name,
                email: userData.email,
                passwordHash,
                role: userData.role
            }
        });

        console.log(`Seeded user: ${user.email} (${user.role})`);
    }
};

main()
    .catch((error) => {
        console.error("Failed to seed users:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });