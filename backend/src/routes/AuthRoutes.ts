import { Router, Request, Response } from "express";
import { authService } from "../services/auth.js";
import { logger } from "../utils/logger.js";
import { authenticate, AuthRequest } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { requireTurnstile } from "../middlewares/turnstile.js";

const router = Router();

router.post("/send-otp", authLimiter, requireTurnstile, async (req: Request, res: Response) => {
  const { phone } = req.body;
  // logger.info("send-otp request", { phone });

  if (!phone) {
    logger.warn("send-otp: missing phone");
    return res.status(400).json({ success: false, message: "Phone number is required" });
  }

  const result = await authService.sendOTP(phone);
  // logger.info("send-otp response", { success: result.success, message: result.message });
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/verify-otp", authLimiter, requireTurnstile, async (req: Request, res: Response) => {
  const { phone, code } = req.body;
  const userAgent = req.headers["user-agent"];
  const ip = req.ip || req.socket.remoteAddress;
  // logger.info("verify-otp request", { phone });

  if (!phone || !code) {
    logger.warn("verify-otp: missing phone or code");
    return res.status(400).json({ success: false, message: "Phone and code are required" });
  }

  const result = await authService.verifyAndLogin(phone, code, userAgent, ip);
  logger.info("verify-otp response", { success: result.success });
  res.status(result.success ? 200 : 401).json(result);
});

router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    logger.warn("refresh: missing refreshToken");
    return res.status(400).json({ success: false, message: "Refresh token is required" });
  }

  const result = await authService.refreshTokens(refreshToken);
  logger.info("refresh response", { success: result.success });
  res.status(result.success ? 200 : 401).json(result);
});

router.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  logger.info("logout request");
  const result = await authService.logout(refreshToken);
  res.json(result);
});

router.post("/logout-all", async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const { jwtService } = await import("../services/jwt.js");
  const payload = jwtService.verifyToken(token);

  const result = await authService.logoutAll(payload.userId);
  logger.info("logout-all response", { userId: payload.userId });
  res.json(result);
});

router.post("/send-email-otp", authLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const userId = req.user?._id?.toString();

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const result = await authService.sendEmailVerification(email, userId);
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/verify-email", authLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Email and code are required" });
  }

  const userId = req.user?._id?.toString();
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const result = await authService.verifyEmail(email, code, userId);
  res.status(result.success ? 200 : 400).json(result);
});

// router.post("/login-with-email", async (req: Request, res: Response) => {
//   const { email, code } = req.body;

//   if (!email || !code) {
//     return res.status(400).json({ success: false, message: "Email and code are required" });
//   }

//   const result = await authService.verifyEmailOTP(email, code);
//   res.status(result.success ? 200 : 401).json(result);
// });

// router.post("/send-email-login-otp", async (req: Request, res: Response) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ success: false, message: "Email is required" });
//   }

//   const result = await authService.sendEmailVerificationOTP(email);
//   res.status(result.success ? 200 : 400).json(result);
// });

export default router;
