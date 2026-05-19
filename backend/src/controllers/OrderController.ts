import { Response } from "express";
import { orderModel } from "../models/OrderModel.js";
import { cartModel } from "../models/CartModel.js";
import { addressModel } from "../models/AddressModel.js";
import { offerModel, calculateDiscount, validateOfferEligibility } from "../models/OfferModel.js";
import { EmailNotificationService } from "../services/EmailNotificationService.js";
import { PaymentService } from "../services/PaymentService.js";
import { AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

export const OrderController = {
  async createOrder(req: AuthRequest, res: Response) {
    try {
      logger.info("Create order request received", {
        user: req.user?._id,
        body: req.body
      });

      const userId = req.user?._id?.toString();
      if (!userId) {
        logger.warn("Unauthorized access attempt");
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const {
        shippingAddressId,
        billingAddressId,
        shippingAddress,
        billingAddress,
        phone,
        email,
        offerCode,
      } = req.body;

      let finalShippingAddress = shippingAddress;
      let finalBillingAddress = billingAddress || finalShippingAddress;

      // 🔹 Shipping Address
      if (shippingAddressId) {
        logger.info("Fetching shipping address", { shippingAddressId });

        const address = await addressModel.findById(shippingAddressId);

        if (!address || address.userId !== userId) {
          logger.warn("Invalid shipping address", { shippingAddressId, userId });
          return res.status(400).json({ success: false, message: "Invalid shipping address ID" });
        }

        finalShippingAddress = address;
      }

      // 🔹 Billing Address
      if (billingAddressId) {
        logger.info("Fetching billing address", { billingAddressId });

        const address = await addressModel.findById(billingAddressId);

        if (!address || address.userId !== userId) {
          logger.warn("Invalid billing address", { billingAddressId, userId });
          return res.status(400).json({ success: false, message: "Invalid billing address ID" });
        }

        finalBillingAddress = address;
      }

      if (!finalShippingAddress) {
        logger.warn("Missing shipping address");
        return res.status(400).json({ success: false, message: "Shipping address is required" });
      }

      // 🔹 Cart
      logger.info("Fetching cart", { userId });
      const cart = await cartModel.getCartWithDetails(userId);

      if (!cart || cart.items.length === 0) {
        logger.warn("Cart is empty", { userId });
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      logger.info("Cart fetched", { items: cart.items.length, subtotal: cart.subtotal });

      // 🔹 Pricing
      const subtotal = cart.subtotal;
      const shippingCost = subtotal > config.logistics.freeShippingThreshold ? 0 : config.logistics.defaultShippingCost;
      const tax = parseFloat((subtotal * 0.18).toFixed(2));

      // 🔹 Offer / Coupon
      let discount = 0;
      let appliedOffer: { _id: any; code: string; title: string } | null = null;

      if (offerCode) {
        const offer = await offerModel.findByCode(offerCode);
        if (!offer) {
          return res.status(400).json({ success: false, message: "Invalid offer code" });
        }

        const eligibility = validateOfferEligibility(offer, subtotal);
        if (!eligibility.valid) {
          return res.status(400).json({ success: false, message: eligibility.reason });
        }

        if (offer.maxUsagePerUser) {
          const userUsage = await offerModel.getUserUsageCount(offer._id!.toString(), userId);
          if (userUsage >= offer.maxUsagePerUser) {
            return res.status(400).json({ success: false, message: "You have already used this offer the maximum number of times" });
          }
        }

        discount = calculateDiscount(offer, subtotal, cart.items);
        appliedOffer = { _id: offer._id, code: offer.code, title: offer.title };
        logger.info("Offer applied", { code: offer.code, discount });
      }

      const total = parseFloat((subtotal + shippingCost + tax - discount).toFixed(2));

      logger.info("Price calculation", {
        subtotal,
        shippingCost,
        tax,
        discount,
        total
      });

      // 🔹 Order Data
      const orderData = {
        userId,
        phone: phone || req.user.phone,
        email: email || req.user.email,
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.name || "Unknown Product",
          variantId: item.variantId,
          variantSize: `${item.variantSize || ""} ${item.variantUnit || ""}`.trim() || "Default",
          sku: item.sku || "N/A",
          image: item.image ?? undefined,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        ...(appliedOffer && { offerCode: appliedOffer.code, offerTitle: appliedOffer.title }),
        shippingAddress: finalShippingAddress,
        billingAddress: finalBillingAddress,
        payment: {
          provider: "razorpay" as const,
          amount: total,
          currency: "INR",
          status: "pending" as const
        },
        status: "pending" as const,
        source: "api" as const
      };

      logger.info("Creating order in DB");

      const order = await orderModel.create(orderData);

      logger.info("Order created", { orderId: order._id, orderNumber: order.orderNumber });

      // 🔹 Razorpay
      logger.info("Creating Razorpay order", { amount: total });

      const razorpayOrder = await PaymentService.createRazorpayOrder(
        total,
        "INR",
        order.orderNumber
      );

      logger.info("Razorpay order created", { razorpayOrderId: razorpayOrder.id });

      await orderModel.updatePayment(order._id!.toString(), {
        razorpayOrderId: razorpayOrder.id
      });

      logger.info("Order payment updated");

      // 🔹 Record offer usage
      if (appliedOffer) {
        await Promise.all([
          offerModel.incrementUsage(appliedOffer._id.toString()),
          offerModel.recordUsage({
            offerId: appliedOffer._id.toString(),
            userId,
            orderId: order._id!.toString(),
            discount,
          }),
        ]);
        logger.info("Offer usage recorded", { code: appliedOffer.code });
      }

      // 🔹 Email — order placed
      const userName = `${(req.user as any).firstName || ""} ${(req.user as any).lastName || ""}`.trim() || "Customer";
      EmailNotificationService.orderPlaced(order, email || (req.user as any).email, userName);
      return res.status(201).json({
        success: true,
        data: {
          order,
          razorpayOrder: {
            ...razorpayOrder,
            key: process.env.RAZORPAY_KEY_ID,
          }
        }
      });

    } catch (error) {
      logger.error("Error creating order", {
        error: error instanceof Error ? error.message : error
      });

      return res.status(500).json({
        success: false,
        message: "Failed to create order"
      });
    }
  },

  async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

      const order = await orderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (order.payment.razorpayOrderId !== razorpayOrderId) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }

      const isValid = PaymentService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        await orderModel.updatePayment(orderId, { status: "failed" });
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }

      await orderModel.updatePayment(orderId, {
        razorpayPaymentId,
        razorpaySignature,
        status: "completed",
        paidAt: new Date()
      });

      await orderModel.updateStatus(orderId, "confirmed", "Payment received successfully");

      // Email — payment confirmed (reload updated order)
      const updatedOrder = await orderModel.findById(orderId);
      if (updatedOrder) {
        EmailNotificationService.paymentConfirmed(updatedOrder, updatedOrder.email, "Customer");
      }

      // 🔹 Clear cart ONLY after successful payment verification
      await cartModel.clearCart(order.userId);

      return res.json({ success: true, message: "Payment verified successfully" });
    } catch (error) {
      logger.error("Error verifying payment", { error });
      return res.status(500).json({ success: false, message: "Failed to verify payment" });
    }
  },

  async getMyOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await orderModel.findByUserId(userId, { page, limit });
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Error fetching orders", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
  },

};
