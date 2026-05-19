import { Response } from "express";
import { addressModel } from "../models/AddressModel.js";
import { AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";

export const AddressController = {
  async getAddresses(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const addresses = await addressModel.findByUserId(userId);
      return res.json({ success: true, data: addresses });
    } catch (error) {
      logger.error("Error fetching addresses", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
    }
  },

  async createAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const addressData = { ...req.body, userId };
      const address = await addressModel.create(addressData);
      return res.status(201).json({ success: true, data: address });
    } catch (error) {
      logger.error("Error creating address", { error });
      return res.status(500).json({ success: false, message: "Failed to create address" });
    }
  },

  async updateAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const address = await addressModel.update(req.params.id as string, userId, req.body);
      if (!address) return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
      
      return res.json({ success: true, data: address });
    } catch (error) {
      logger.error("Error updating address", { error });
      return res.status(500).json({ success: false, message: "Failed to update address" });
    }
  },

  async deleteAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const success = await addressModel.delete(req.params.id as string, userId);
      if (!success) return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
      
      return res.json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
      logger.error("Error deleting address", { error });
      return res.status(500).json({ success: false, message: "Failed to delete address" });
    }
  },

  async setDefaultAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const success = await addressModel.setAsDefault(req.params.id as string, userId);
      if (!success) return res.status(404).json({ success: false, message: "Address not found or unauthorized" });

      return res.json({ success: true, message: "Address set as default" });
    } catch (error) {
      logger.error("Error setting default address", { error });
      return res.status(500).json({ success: false, message: "Failed to set default address" });
    }
  }
};
