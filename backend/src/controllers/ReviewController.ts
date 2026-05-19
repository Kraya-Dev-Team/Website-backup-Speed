import type { Request, Response } from "express";
import { reviewModel, type Review } from "../models/ReviewModel.js";
import { userModel } from "../models/UserModel.js";
import { uploadImage } from "../services/cloudinary.js";

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const formatReview = (review: Review) => ({
  id: review._id?.toString(),
  productId: review.productId,
  userId: review.userId,
  userName: review.userName,
  orderId: review.orderId,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  images: review.images,
  pros: review.pros,
  cons: review.cons,
  isVerified: review.isVerified,
  isFeatured: review.isFeatured,
  isActive: review.isActive,
  helpful: review.helpful,
  notHelpful: review.notHelpful,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

export const reviewController = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(req: Request & { user?: { _id: { toString: () => string } }; files?: any }, res: Response) {
    try {
      const userId = req.user?._id?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const user = await userModel.findById(userId);
      const userName = req.body.userName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Anonymous";

      let images: { url: string }[] = [];
      if (req.files?.images) {
        for (const file of req.files.images) {
          const uploaded = await uploadImage(file);
          images.push({ url: uploaded.url });
        }
      }

      const review = await reviewModel.create({
        productId: req.body.productId,
        userId,
        userName,
        orderId: req.body.orderId,
        rating: Number(req.body.rating),
        title: req.body.title,
        comment: req.body.comment,
        images: images.length > 0 ? images : undefined,
        pros: req.body.pros ? (Array.isArray(req.body.pros) ? req.body.pros : [req.body.pros]) : undefined,
        cons: req.body.cons ? (Array.isArray(req.body.cons) ? req.body.cons : [req.body.cons]) : undefined,
        isVerified: Boolean(req.body.isVerified),
        isFeatured: false,
        isActive: Boolean(req.body.isActive) || true,
      });
      res.status(201).json({ success: true, data: formatReview(review) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create review", data: error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const review = await reviewModel.findById(req.params.id as string);
      if (!review) {
        return res.status(404).json({ success: false, message: "Review not found" });
      }
      res.json({ success: true, data: formatReview(review) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get review", data: error });
    }
  },

  async getByProduct(req: Request, res: Response) {
    try {
      const filter = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        sortBy: req.query.sortBy as "createdAt" | "helpful" | "rating",
      };
      const result = await reviewModel.findByProduct(req.params.productId as string, filter);
      res.json({
        success: true,
        data: {
          reviews: result.reviews.map(formatReview),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get reviews", data: error });
    }
  },

  async getByUser(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const reviews = await reviewModel.findByUser(req.params.userId as string, limit);
      res.json({ success: true, data: reviews.map(formatReview) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get user reviews", data: error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const review = await reviewModel.update(req.params.id as string, req.body);
      if (!review) {
        return res.status(404).json({ success: false, message: "Review not found" });
      }
      res.json({ success: true, data: formatReview(review) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update review", data: error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const deleted = await reviewModel.delete(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Review not found" });
      }
      res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete review", data: error });
    }
  },

  async markHelpful(req: Request, res: Response) {
    try {
      await reviewModel.markHelpful(req.params.id as string);
      res.json({ success: true, message: "Marked as helpful" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to mark helpful", data: error });
    }
  },

  async markNotHelpful(req: Request, res: Response) {
    try {
      await reviewModel.markNotHelpful(req.params.id as string);
      res.json({ success: true, message: "Marked as not helpful" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to mark not helpful", data: error });
    }
  },

  async getRatingDistribution(req: Request, res: Response) {
    try {
      const distribution = await reviewModel.getRatingDistribution(req.params.productId as string);
      res.json({ success: true, data: distribution });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get rating distribution", data: error });
    }
  },
};