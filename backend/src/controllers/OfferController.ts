import { Response } from "express";
import { offerModel, calculateDiscount, validateOfferEligibility, Offer } from "../models/OfferModel.js";
import { cartModel } from "../models/CartModel.js";
import { AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

export const OfferController = {
  // ── Admin: Create offer ──────────────────────────────────────────────────
  async createOffer(req: AuthRequest, res: Response) {
    try {
      const {
        code, title, description, type,
        discountPercentage, maxDiscountAmount,
        discountAmount,
        buyQuantity, getQuantity,
        minCartValue, cartDiscountAmount,
        minOrderValue, maxUsageCount, maxUsagePerUser,
        isActive, startDate, endDate,
      } = req.body;

      if (!code || !title || !type) {
        return res.status(400).json({ success: false, message: "code, title, and type are required" });
      }

      const validTypes = ["percentage", "flat", "buy_x_get_y", "cart_value"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(", ")}` });
      }

      // Type-specific validation
      if (type === "percentage" && !discountPercentage) {
        return res.status(400).json({ success: false, message: "discountPercentage is required for percentage type" });
      }
      if (type === "flat" && !discountAmount) {
        return res.status(400).json({ success: false, message: "discountAmount is required for flat type" });
      }
      if (type === "buy_x_get_y" && (!buyQuantity || !getQuantity)) {
        return res.status(400).json({ success: false, message: "buyQuantity and getQuantity are required for buy_x_get_y type" });
      }
      if (type === "cart_value" && (!minCartValue || !cartDiscountAmount)) {
        return res.status(400).json({ success: false, message: "minCartValue and cartDiscountAmount are required for cart_value type" });
      }

      // Check duplicate code
      const existing = await offerModel.findByCode(code);
      if (existing) {
        return res.status(409).json({ success: false, message: "Offer code already exists" });
      }

      const offerData: Omit<Offer, "_id" | "usageCount" | "createdAt" | "updatedAt"> = {
        code,
        title,
        description,
        type,
        isActive: isActive ?? true,
        ...(discountPercentage !== undefined && { discountPercentage }),
        ...(maxDiscountAmount !== undefined && { maxDiscountAmount }),
        ...(discountAmount !== undefined && { discountAmount }),
        ...(buyQuantity !== undefined && { buyQuantity }),
        ...(getQuantity !== undefined && { getQuantity }),
        ...(minCartValue !== undefined && { minCartValue }),
        ...(cartDiscountAmount !== undefined && { cartDiscountAmount }),
        ...(minOrderValue !== undefined && { minOrderValue }),
        ...(maxUsageCount !== undefined && { maxUsageCount }),
        ...(maxUsagePerUser !== undefined && { maxUsagePerUser }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      };

      const offer = await offerModel.create(offerData);
      return res.status(201).json({ success: true, data: offer });
    } catch (error) {
      logger.error("Error creating offer", { error });
      return res.status(500).json({ success: false, message: "Failed to create offer" });
    }
  },

  // ── Admin: List offers ───────────────────────────────────────────────────
  async listOffers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const isActive = req.query.isActive !== undefined
        ? req.query.isActive === "true"
        : undefined;

      const result = await offerModel.list({ isActive, page, limit });
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Error listing offers", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch offers" });
    }
  },

  // ── Admin: Get offer by ID ───────────────────────────────────────────────
  async getOffer(req: AuthRequest, res: Response) {
    try {
      const offer = await offerModel.findById(req.params.id as string);
      if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
      return res.json({ success: true, data: offer });
    } catch (error) {
      logger.error("Error getting offer", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch offer" });
    }
  },

  // ── Admin: Update offer ──────────────────────────────────────────────────
  async updateOffer(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const existing = await offerModel.findById(id);
      if (!existing) return res.status(404).json({ success: false, message: "Offer not found" });

      // If code is being changed, check for duplicates
      if (req.body.code) {
        const duplicate = await offerModel.findByCode(req.body.code as string);
        if (duplicate && duplicate._id?.toString() !== id) {
          return res.status(409).json({ success: false, message: "Offer code already exists" });
        }
      }

      const updateData = { ...req.body };
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

      const offer = await offerModel.update(id, updateData);
      return res.json({ success: true, data: offer });
    } catch (error) {
      logger.error("Error updating offer", { error });
      return res.status(500).json({ success: false, message: "Failed to update offer" });
    }
  },

  // ── Admin: Delete offer ──────────────────────────────────────────────────
  async deleteOffer(req: AuthRequest, res: Response) {
    try {
      const deleted = await offerModel.delete(req.params.id as string);
      if (!deleted) return res.status(404).json({ success: false, message: "Offer not found" });
      return res.json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
      logger.error("Error deleting offer", { error });
      return res.status(500).json({ success: false, message: "Failed to delete offer" });
    }
  },

  // ── Public: List active offers ───────────────────────────────────────────
  async listActiveOffers(_req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const result = await offerModel.list({ isActive: true });
      // Filter by date and return limited public info
      const offers = result.offers
        .filter(o => (!o.startDate || o.startDate <= now) && (!o.endDate || o.endDate >= now))
        .map(({ code, title, description, type, discountPercentage, maxDiscountAmount,
                discountAmount, buyQuantity, getQuantity, minCartValue, cartDiscountAmount,
                minOrderValue, endDate }) => ({
          code, title, description, type, discountPercentage, maxDiscountAmount,
          discountAmount, buyQuantity, getQuantity, minCartValue, cartDiscountAmount,
          minOrderValue, endDate,
        }));
      return res.json({ success: true, data: { offers, total: offers.length } });
    } catch (error) {
      logger.error("Error listing active offers", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch offers" });
    }
  },

  // ── User: Validate offer code at checkout ────────────────────────────────
  async validateOffer(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { offerCode } = req.body;
      if (!offerCode) {
        return res.status(400).json({ success: false, message: "offerCode is required" });
      }

      const offer = await offerModel.findByCode(offerCode);
      if (!offer) {
        return res.status(404).json({ success: false, message: "Invalid offer code" });
      }

      // Fetch user's cart for context
      const cart = await cartModel.getCartWithDetails(userId);
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Your cart is empty" });
      }

      const subtotal = cart.subtotal;

      // Eligibility check
      const eligibility = validateOfferEligibility(offer, subtotal);
      if (!eligibility.valid) {
        return res.status(400).json({ success: false, message: eligibility.reason });
      }

      // Per-user usage check
      if (offer.maxUsagePerUser) {
        const userUsage = await offerModel.getUserUsageCount(offer._id!.toString(), userId);
        if (userUsage >= offer.maxUsagePerUser) {
          return res.status(400).json({ success: false, message: "You have already used this offer the maximum number of times" });
        }
      }

      const discount = calculateDiscount(offer, subtotal, cart.items);
      const shippingCost = subtotal > config.logistics.freeShippingThreshold ? 0 : config.logistics.defaultShippingCost;
      const tax = parseFloat((subtotal * 0.18).toFixed(2));
      const total = parseFloat((subtotal + shippingCost + tax - discount).toFixed(2));

      return res.json({
        success: true,
        data: {
          valid: true,
          offer: {
            code: offer.code,
            title: offer.title,
            type: offer.type,
          },
          breakdown: {
            subtotal,
            shippingCost,
            tax,
            discount,
            total,
          },
        },
      });
    } catch (error) {
      logger.error("Error validating offer", { error });
      return res.status(500).json({ success: false, message: "Failed to validate offer" });
    }
  },
};
