import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const rateLimitStores = new Map<string, Map<string, { count: number; resetTime: number }>>();

export const createRateLimiter = (limiterName: string, config: RateLimitConfig) => {
  if (!rateLimitStores.has(limiterName)) {
    rateLimitStores.set(limiterName, new Map());
  }
  const store = rateLimitStores.get(limiterName)!;

  // Cleanup old entries periodically to prevent memory leaks
  const intervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key);
      }
    }
  }, 10 * 60 * 1000);
  
  if (typeof intervalId.unref === "function") {
    intervalId.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}`;
    const now = Date.now();

    const record = store.get(key);

    if (!record) {
      store.set(key, { count: 1, resetTime: now + config.windowMs });
      next();
      return;
    }

    if (now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + config.windowMs });
      next();
      return;
    }

    record.count += 1;

    if (record.count > config.max) {
      logger.warn(`RateLimit Exceeded: IP ${ip} exceeded limit on ${req.method} ${req.url} [Limiter: ${limiterName}]`);
      res.status(429).json({
        success: false,
        message: config.message,
      });
      return;
    }

    next();
  };
};

// Global rate limiter: Max 100 requests per minute
export const globalLimiter = createRateLimiter("global", {
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many requests from this IP. Please try again after a minute.",
});

// Auth rate limiter: Max 15 requests per 15 minutes (Signup/Login/OTP)
export const authLimiter = createRateLimiter("auth", {
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});
