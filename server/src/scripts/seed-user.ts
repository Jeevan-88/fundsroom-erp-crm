import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

const email = "admin@fundsroom.local";
const password = "Admin@12345";

const main = async (): Promise<void> => {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: {
            email
        },
        update: {
            passwordHash,
            name: "System Administrator",
            role: "ADMIN"
        },
        create: {
            name: "System Administrator",
            email,
            passwordHash,
            role: "ADMIN"
        }
    });

    console.log(`Seeded user: ${user.email}`);
};

main()
    .catch((error) => {
        console.error("Failed to seed user:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });