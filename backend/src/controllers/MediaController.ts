import type { Request, Response } from "express";
import { uploadImage } from "../services/cloudinary.js";

export const mediaController = {
  async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }

      const result = await uploadImage(req.file as any);
      res.json({ 
        success: true, 
        data: { 
          url: result.url,
          publicId: result.publicId
        } 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ success: false, message: "Failed to upload image", data: error });
    }
  },

  async uploadMultiple(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: "No files provided" });
      }

      const uploadPromises = files.map(file => uploadImage(file));
      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        data: results.map(r => ({ url: r.url, publicId: r.publicId }))
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ success: false, message: "Failed to upload images", data: error });
    }
  }
};
