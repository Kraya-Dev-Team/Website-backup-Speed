import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const timeTakenMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    
    const message = `${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${timeTakenMs}ms)`;
    
    logger.info(message, {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      timeTakenMs: parseFloat(timeTakenMs),
    });
  });

  next();
};
