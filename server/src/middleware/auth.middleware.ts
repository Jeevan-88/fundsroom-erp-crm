import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Authentication required"
        });
        return;
    }

    const token = authorization.substring("Bearer ".length);

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        if (
            typeof payload !== "object" ||
            !payload ||
            typeof payload.userId !== "string" ||
            typeof payload.role !== "string"
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
            return;
        }

        req.user = {
            userId: payload.userId,
            role: payload.role
        };

        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};