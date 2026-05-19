import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8000"),
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  otp: {
    maxAttempts: 5,
    expiryMinutes: 5,
    resendCooldownMinutes: 1,
  },
  msg91: {
    apiKey: process.env.MSG91_API_KEY || "",
    senderId: process.env.MSG91_SENDER_ID || "OMNIC",
    otpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID || "",
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/omnibase",
  },
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  ses: {
    fromEmail: process.env.SES_FROM_EMAIL || "noreply@yourdomain.com",
    fromName: process.env.SES_FROM_NAME || "OmniCore",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || "",
    password: process.env.SHIPROCKET_PASSWORD || "",
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "maalpur",
  },
  adminEmail: process.env.ADMIN_EMAIL || "",
  logistics: {
    freeShippingThreshold: 1000,
    defaultShippingCost: 50,
    defaultWeight: 0.5, // kg
    defaultDimensions: {
      length: 10,
      breadth: 10,
      height: 10
    }
  }
};
