import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import { generateAccessToken } from "../../utils/jwt.js";
import type { LoginInput } from "./auth.schema.js";

export const login = async (input: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: {
            email: input.email
        }
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.passwordHash
    );

    if (!passwordMatches) {
        throw new Error("Invalid email or password");
    }

    const token = generateAccessToken({
        userId: user.id,
        role: user.role
    });

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
};