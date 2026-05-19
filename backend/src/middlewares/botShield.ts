import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

// Blacklisted IPs set in-memory (banned for 1 hour by default)
const blacklist = new Map<string, number>();
const BAN_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Forbidden paths to trigger immediate ban (scanner bots)
const forbiddenPaths = [
  "/.env",
  "/.git/config",
  "/.aws/credentials",
  "/secrets.json",
  "/config.json",
  "/settings.py",
  "/web.config",
  "/config.php",
  "/actuator/health",
  "/.well-known/security.txt",
  "/debug/default/view",
  "/_profiler/phpinfo",
  "/wp-admin",
  "/wp-login.php",
  "/wp-content/plugins",
  "/administrator/index.php",
  "/phpmyadmin",
  "/xmlrpc.php",
  "/api/v1/users",
  "/api/debug",
  "/api/config",
  "/api/v1/debug"
];

// Forbidden patterns (regex)
const forbiddenPatterns = [
  /\.env$/,
  /\.git\//,
  /\.php$/,
  /\.asp$/,
  /\.jsp$/,
  /\.cgi$/,
  /\.py$/
];

export const botShield = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Check if IP is currently blacklisted
  const banExpiry = blacklist.get(ip);
  if (banExpiry) {
    if (Date.now() < banExpiry) {
      logger.warn(`BotShield: Blocked blacklisted IP request from ${ip} to ${req.method} ${req.url}`);
      res.status(403).json({
        success: false,
        message: "Forbidden: Access temporarily restricted due to suspicious activity.",
      });
      return;
    } else {
      // Ban expired, remove from blacklist
      blacklist.delete(ip);
    }
  }

  const url = req.originalUrl || req.url;

  // Check for forbidden path scans
  const isForbiddenPath = forbiddenPaths.some(p => url.toLowerCase().includes(p.toLowerCase()));
  const isForbiddenPattern = forbiddenPatterns.some(regex => regex.test(url.toLowerCase()));

  if (isForbiddenPath || isForbiddenPattern) {
    logger.error(`BotShield DETECTED MALICIOUS PROBE: IP ${ip} scanned forbidden resource ${url}. Banning IP.`);
    blacklist.set(ip, Date.now() + BAN_DURATION_MS);
    res.status(403).json({
      success: false,
      message: "Forbidden: Malicious activity detected and IP logged.",
    });
    return;
  }

  next();
};
