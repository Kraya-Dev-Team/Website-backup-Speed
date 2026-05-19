import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * Cloudflare Turnstile Human Verification Middleware
 * 
 * If TURNSTILE_SECRET_KEY is defined in .env, this will strictly validate
 * the `captchaToken` provided in the request body against Cloudflare's API.
 * If not defined, it silently permits the request (ideal for local development).
 */
export const requireTurnstile = async (req: Request, res: Response, next: NextFunction) => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification if keys are not configured (plug-and-play for local dev)
  if (!secretKey) {
    return next();
  }

  const { captchaToken } = req.body;

  if (!captchaToken) {
    logger.warn(`Turnstile Check: Blocked request from ${req.ip} to ${req.method} ${req.url} due to missing captchaToken`);
    res.status(403).json({
      success: false,
      message: "Security verification failed: Captcha token is required.",
    });
    return;
  }

  try {
    const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    
    // Using standard URLSearchParams for perfect form-urlencoded escaping
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", captchaToken);
    if (req.ip) {
      params.append("remoteip", req.ip);
    }

    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data: any = await response.json();

    if (!response.ok || !data.success) {
      logger.error(`Turnstile Check: Verification failed for IP ${req.ip}. Status: ${response.status}. Response payload: ${JSON.stringify(data)}`);
      res.status(403).json({
        success: false,
        message: "Security verification failed: Captcha token is invalid or has expired.",
      });
      return;
    }

    next();
  } catch (err: any) {
    logger.error("Turnstile Check: Error during siteverify request", { error: err.message });
    
    // Fail Closed: Protect system if verification service goes offline or experiences errors
    res.status(500).json({
      success: false,
      message: "Internal security check error. Please try again later.",
    });
  }
};
