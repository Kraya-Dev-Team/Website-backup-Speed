import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/index.js";

export interface TokenPayload {
  userId: string;
  sessionId: string;
  role?: string;
}

export const jwtService = {
  generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: "15m" };
    return jwt.sign(payload, config.jwt.secret, options);
  },

  generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: "7d" };
    return jwt.sign(payload, config.jwt.secret, options);
  },

  verifyToken(token: string): TokenPayload & { role: string } {
    return jwt.verify(token, config.jwt.secret) as TokenPayload & { role: string };
  },
};
