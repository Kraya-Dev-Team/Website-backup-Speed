import { Response } from "express";
import { cartModel } from "../models/CartModel.js";
import { AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";

async function enrichedCartForUser(userId: string) {
  const cart = await cartModel.getCartWithDetails(userId);
  if (!cart) {
    await cartModel.createCart(userId);
    return cartModel.getCartWithDetails(userId);
  }
  return cart;
}

export const CartController = {
  async getCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const cart = await enrichedCartForUser(userId);
      return res.json({ success: true, data: cart });
    } catch (error) {
      logger.error("Error getting cart", { error });
      return res.status(500).json({ success: false, message: "Failed to get cart" });
    }
  },

  async updateCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: "Items must be an array" });
      }

      let cart = await cartModel.getCart(userId);
      if (!cart) {
        cart = await cartModel.createCart(userId);
      }

      await cartModel.updateCart(userId, items);
      const enriched = await cartModel.getCartWithDetails(userId);
      return res.json({ success: true, data: enriched });
    } catch (error) {
      logger.error("Error updating cart", { error });
      return res.status(500).json({ success: false, message: "Failed to update cart" });
    }
  },

  async syncCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: "Items must be an array" });
      }

      let cart = await cartModel.getCart(userId);
      if (!cart) {
        cart = await cartModel.createCart(userId);
      }

      const mergedItems = [...cart.items];
      for (const localItem of items) {
        const existingItemIndex = mergedItems.findIndex(
          (i) => i.productId === localItem.productId && i.variantId === localItem.variantId
        );
        if (existingItemIndex > -1) {
          mergedItems[existingItemIndex].quantity = Math.max(
            mergedItems[existingItemIndex].quantity,
            localItem.quantity
          );
        } else {
          mergedItems.push(localItem);
        }
      }

      await cartModel.updateCart(userId, mergedItems);
      const enriched = await cartModel.getCartWithDetails(userId);
      return res.json({ success: true, data: enriched });
    } catch (error) {
      logger.error("Error syncing cart", { error });
      return res.status(500).json({ success: false, message: "Failed to sync cart" });
    }
  },

  async clearCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      await cartModel.clearCart(userId);
      return res.json({ success: true, message: "Cart cleared" });
    } catch (error) {
      logger.error("Error clearing cart", { error });
      return res.status(500).json({ success: false, message: "Failed to clear cart" });
    }
  },
};
