import type { Request, Response } from "express";
import { loginSchema } from "./auth.schema.js";
import { login } from "./auth.service.js";

export const loginController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({
            success: false,
            message: "Invalid request data",
            errors: result.error.flatten()
        });
        return;
    }

    try {
        const authResult = await login(result.data);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: authResult
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};