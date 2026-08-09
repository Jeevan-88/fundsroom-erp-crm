import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "FundsRoom ERP API is running",
            database: "connected"
        });
    } catch (error) {
        console.error("Database health check failed:", error);

        res.status(503).json({
            success: false,
            message: "API is running but database is unavailable"
        });
    }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
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