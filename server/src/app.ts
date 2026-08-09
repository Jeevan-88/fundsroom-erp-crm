import express from "express";
import cors from "cors";
import prisma from "./lib/prisma.js";
import authRoutes from "./modules/auth/auth.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import { challanRoutes } from "./modules/challans/challan.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import stockRoutes from "./modules/stock/stock.routes.js";
import {
    authenticate,
    type AuthenticatedRequest
} from "./middleware/auth.middleware.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins.length > 0 ? allowedOrigins : true,
        credentials: true
    })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock", stockRoutes);

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

app.get(
    "/api/auth/me",
    authenticate,
    (req: AuthenticatedRequest, res) => {
        res.status(200).json({
            success: true,
            data: {
                userId: req.user?.userId,
                role: req.user?.role
            }
        });
    }
);

export default app;