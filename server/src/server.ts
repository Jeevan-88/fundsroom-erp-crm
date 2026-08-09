import dotenv from "dotenv";
import prisma from "./lib/prisma.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`FundsRoom ERP API running on port ${PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        await prisma.$disconnect();
        console.log("Server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});