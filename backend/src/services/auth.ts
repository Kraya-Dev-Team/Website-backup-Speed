import { userModel } from "../models/UserModel.js";
import { sessionModel } from "../models/SessionModel.js";
import { otpModel } from "../models/OtpModel.js";
import { addressModel } from "../models/AddressModel.js";
import { jwtService } from "./jwt.js";
import { otpService } from "./otp.js";
import { emailService } from "./email.js";
import bcrypt from "bcryptjs";

export interface AuthResult {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export const authService = {
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      return { success: false, message: "Invalid phone number" };
    }
    return otpService.sendOTP(normalizedPhone);
  },

  async verifyAndLogin(
    phone: string,
    code: string,
    userAgent?: string,
    ip?: string,
    role?: "admin" | "customer"
  ): Promise<AuthResult> {
    const normalizedPhone = phone.replace(/\D/g, "");
    const verification = await otpService.verifyOTP(normalizedPhone, code);

    if (!verification.valid) {
      return { success: false, message: verification.message };
    }

    let user = await userModel.findByPhone(normalizedPhone);
    if (!user) {
      user = await userModel.create(normalizedPhone, role || "customer");
    }

    const payload = { userId: user._id!.toString(), sessionId: "", role: user.role };
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    await sessionModel.create(user._id!.toString(), refreshToken, userAgent, ip);

    const { _id, ...userWithoutSensitive } = user;
    const addresses = await addressModel.findByUserId(user._id!.toString());

    return {
      success: true,
      user: { ...userWithoutSensitive, addresses },
      accessToken,
      refreshToken,
    };
  },

  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = jwtService.verifyToken(refreshToken);
      const session = await sessionModel.findByRefreshToken(refreshToken);

      if (!session) {
        return { success: false, message: "Session not found" };
      }

      if (new Date() > new Date(session.expiresAt)) {
        await sessionModel.delete(session._id!.toString());
        return { success: false, message: "Session expired" };
      }

      const user = await userModel.findById(payload.userId);
      const role = user?.role || "customer";

      const accessToken = jwtService.generateAccessToken({ userId: payload.userId, sessionId: session._id!.toString(), role });
      const newRefreshToken = jwtService.generateRefreshToken({ userId: payload.userId, sessionId: session._id!.toString(), role });

      await sessionModel.delete(session._id!.toString());
      await sessionModel.create(payload.userId, newRefreshToken, session.userAgent, session.ip);

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      return { success: false, message: "Invalid refresh token" };
    }
  },

  async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    const session = await sessionModel.findByRefreshToken(refreshToken);
    if (session) {
      await sessionModel.delete(session._id!.toString());
    }
    return { success: true, message: "Logged out successfully" };
  },

  async logoutAll(userId: string): Promise<{ success: boolean; message: string }> {
    const count = await sessionModel.deleteByUserId(userId);
    return { success: true, message: `Logged out from ${count} sessions` };
  },

  async sendEmailVerification(email: string, userId: string): Promise<{ success: boolean; message: string }> {
    const user = await userModel.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: "Invalid email address" };
    }

    const existingUser = await userModel.findByEmail(normalizedEmail);
    if (existingUser && existingUser._id!.toString() !== userId) {
      return { success: false, message: "Email already in use" };
    }

    const existingOTP = await otpModel.findLatestByEmail(normalizedEmail);
    if (existingOTP) {
      const createdAt = new Date(existingOTP.createdAt);
      const cooldown = 60 * 1000;
      if (new Date().getTime() - createdAt.getTime() < cooldown) {
        return { success: false, message: "Please wait before requesting another verification email" };
      }
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await otpModel.createForEmail(normalizedEmail, code);

    const result = await emailService.send({
      to: normalizedEmail,
      subject: "Verify Your Email",
      body: `Your email verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    });

    if (!result.success) {
      return { success: false, message: "Failed to send verification email" };
    }

    return { success: true, message: "Verification email sent" };
  },

  async verifyEmail(email: string, code: string, userId: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (process.env.OTP_DEBUG !== "true" || code !== "1231") {
      const otp = await otpModel.findLatestByEmail(normalizedEmail);

      if (!otp || !otp.email) {
        return { success: false, message: "No verification request found" };
      }

      if (new Date() > new Date(otp.expiresAt)) {
        return { success: false, message: "Verification code has expired" };
      }

      if (otp.attempts >= 5) {
        return { success: false, message: "Maximum attempts exceeded" };
      }

      await otpModel.incrementAttempts(normalizedEmail);

      const isValid = await bcrypt.compare(code, otp.code);
      if (!isValid) {
        return { success: false, message: "Invalid verification code" };
      }
    }

    await userModel.setEmail(userId, normalizedEmail);

    return { success: true, message: "Email verified successfully" };
  },

  async sendEmailVerificationOTP(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: "Invalid email address" };
    }

    const existingOTP = await otpModel.findLatestByEmail(normalizedEmail);
    if (existingOTP) {
      const createdAt = new Date(existingOTP.createdAt);
      const cooldown = 60 * 1000;
      if (new Date().getTime() - createdAt.getTime() < cooldown) {
        return { success: false, message: "Please wait before requesting another code" };
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await otpModel.createForEmail(normalizedEmail, code);

    const result = await emailService.send({
      to: normalizedEmail,
      subject: "Your Verification Code",
      body: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    });

    if (!result.success) {
      return { success: false, message: "Failed to send verification code" };
    }

    return { success: true, message: "Verification code sent to your email" };
  },

  async verifyEmailOTP(email: string, code: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    const isDebug = process.env.OTP_DEBUG === "true" && code === "1231";
    if (!isDebug) {
      const otp = await otpModel.findLatestByEmail(normalizedEmail);

      if (!otp) {
        return { success: false, message: "No verification request found" };
      }

      if (new Date() > new Date(otp.expiresAt)) {
        return { success: false, message: "Verification code has expired" };
      }

      if (otp.attempts >= 5) {
        return { success: false, message: "Maximum attempts exceeded" };
      }

      await otpModel.incrementAttempts(normalizedEmail);

      const isValid = await bcrypt.compare(code, otp.code);
      if (!isValid) {
        return { success: false, message: "Invalid verification code" };
      }
    }

    let user = await userModel.findByEmail(normalizedEmail);
    if (!user) {
      return { success: false, message: "No account found with this email" };
    }

    await userModel.update(user._id!.toString(), { isVerified: true });
    await otpModel.verify(normalizedEmail);

    const payload = { userId: user._id!.toString(), sessionId: "", role: user.role };
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    const { _id, ...userWithoutSensitive } = user;
    const addresses = await addressModel.findByUserId(user._id!.toString());

    return {
      success: true,
      user: { ...userWithoutSensitive, addresses },
      accessToken,
      refreshToken,
    };
  },
};
