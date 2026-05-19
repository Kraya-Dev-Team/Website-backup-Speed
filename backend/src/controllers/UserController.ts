// src/controllers/user.ts
import type { Request, Response } from "express";

export const getUsers = async (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: ["user1", "user2"]
    });
};