import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/jwt.js";
import { userModel } from "../models/UserModel.js";
import { logger } from "../utils/logger.js";
import { UserRole } from "../models/UserModel.js";

export interface AuthRequest extends Request {
  user?: any;
  sessionId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  logger.info("authHeader", { authHeader });
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwtService.verifyToken(token);
    const user = await userModel.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    req.sessionId = payload.sessionId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};
