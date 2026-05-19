import { config } from "../config/index.js";
import { otpModel } from "../models/OtpModel.js";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";

const generateOTP = (): string => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  logger.info(">>> generateOTP", { otp });
  return otp;
};

export const otpService = {
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    // logger.info(">>> sendOTP START", { phone });

    const existingOTP = await otpModel.findLatestByPhone(phone);
    const now = new Date();

    if (existingOTP) {
      const createdAt = new Date(existingOTP.createdAt);
      const cooldown = config.otp.resendCooldownMinutes * 60 * 1000;
      if (now.getTime() - createdAt.getTime() < cooldown) {
        // logger.warn(">>> sendOTP COOLDOWN", { phone });
        return { success: false, message: "Please wait before requesting another OTP" };
      }
    }

    const code = generateOTP();
    // logger.info(">>> sendOTP CODE_GENERATED", { phone, code });
    await otpModel.create(phone, code);
    // logger.info(">>> sendOTP SAVED_TO_DB", { phone });

    if (config.msg91.apiKey && process.env.OTP_DEBUG !== "true") {
      // logger.info(">>> sendOTP CALLING_MSG91", { phone });
      try {
        const url = new URL("https://control.msg91.com/api/v5/otp");

        // append query params properly
        url.searchParams.append("mobile", phone);
        url.searchParams.append("authkey", config.msg91.apiKey);
        url.searchParams.append("template_id", config.msg91.otpTemplateId);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            Param1: "value1",
            Param2: "value2"
          })
        });

        const data = await response.json();
        // logger.info(">>> sendOTP MSG91_RESPONSE", { status: response.status, data });

        if (response.ok) {
          // logger.info(">>> sendOTP SUCCESS", { phone });
        } else {
          logger.error(">>> sendOTP MSG91_FAILED", { data });
        }
      } catch (error) {
        logger.error(">>> sendOTP MSG91_ERROR", { error });
      }
    } else {
      // logger.info(">>> sendOTP DEV_MODE", { phone, code });
    }

    return { success: true, message: "OTP sent successfully" };
  },

  async verifyOTP(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
    if (process.env.OTP_DEBUG === "true" && code === "1231") {
      logger.warn(">>> verifyOTP DEBUG_BYPASS", { phone });
      return { valid: true, message: "OTP verified successfully" };
    }

    const otp = await otpModel.findLatestByPhone(phone);

    if (!otp) {
      logger.warn(">>> verifyOTP NO_OTP", { phone });
      return { valid: false, message: "No OTP found. Please request a new one" };
    }

    if (new Date() > new Date(otp.expiresAt)) {
      logger.warn(">>> verifyOTP EXPIRED", { phone });
      return { valid: false, message: "OTP has expired. Please request a new one" };
    }

    if (otp.attempts >= config.otp.maxAttempts) {
      logger.warn(">>> verifyOTP MAX_ATTEMPTS", { phone, attempts: otp.attempts });
      return { valid: false, message: "Maximum attempts exceeded. Please request a new OTP" };
    }

    await otpModel.incrementAttempts(phone);
    // logger.info(">>> verifyOTP ATTEMPT_INCREMENTED", { phone });

    const isValid = await bcrypt.compare(code, otp.code);
    // logger.info(">>> verifyOTP CODE_COMPARE", { phone, isValid });

    if (!isValid) {
      logger.warn(">>> verifyOTP INVALID", { phone });
      return { valid: false, message: "Invalid OTP" };
    }

    await otpModel.verify(phone);
    // logger.info(">>> verifyOTP SUCCESS", { phone });
    return { valid: true, message: "OTP verified successfully" };
  },
};
