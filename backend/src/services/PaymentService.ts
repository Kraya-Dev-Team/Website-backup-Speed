import crypto from "crypto";
import { logger } from "../utils/logger.js";
import Razorpay from "razorpay";

export const PaymentService = {
  getRazorpayInstance() {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_yourkey",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "your_secret",
    });
  },

  async createRazorpayOrder(amount: number, currency: string = "INR", receipt: string) {
    try {
      const razorpay = this.getRazorpayInstance();
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt,
      });
      return order;
    } catch (error) {
      logger.error("Error creating Razorpay order", { error });
      throw new Error("Failed to create Razorpay order");
    }
  },

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || "your_secret";
    const body = orderId + "|" + paymentId;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  },

  async processRefund(paymentId: string, amount?: number) {
    try {
      const razorpay = this.getRazorpayInstance();
      const options = amount ? { amount: Math.round(amount * 100) } : {};
      const refund = await razorpay.payments.refund(paymentId, options);
      return refund;
    } catch (error) {
      logger.error("Error processing refund", { error });
      throw new Error("Failed to process refund");
    }
  }
};
