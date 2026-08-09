import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

const users = [
    {
        name: "System Administrator",
        email: "admin@fundsroom.local",
        password: "Admin@12345",
        role: "ADMIN" as const
    },
    {
        name: "Sales User",
        email: "sales@fundsroom.local",
        password: "Sales@12345",
        role: "SALES" as const
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