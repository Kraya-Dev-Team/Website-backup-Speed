import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface ReviewImage {
  url: string;
}

export interface Review {
  _id?: ObjectId;
  productId: string;
  userId: string;
  userName: string;
  orderId?: string;
  
  rating: number;
  title?: string;
  comment: string;
  images?: ReviewImage[];
  
  pros?: string[];
  cons?: string[];
  
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  
  helpful: number;
  notHelpful: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export const reviewModel = {
  async create(data: Omit<Review, "_id" | "createdAt" | "updatedAt" | "helpful" | "notHelpful">): Promise<Review> {
    const db = getDB();
    const now = new Date();
    const review: Review = {
      ...data,
      helpful: 0,
      notHelpful: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("reviews").insertOne(review as any);
    
    await this.updateProductRating(data.productId);
    
    return review;
  },

  async findById(id: string): Promise<Review | null> {
    const db = getDB();
    return db.collection("reviews").findOne({ _id: new ObjectId(id) }) as Promise<Review | null>;
  },

  async findByProduct(productId: string, filter?: { 
    limit?: number; 
    page?: number; 
    rating?: number;
    sortBy?: "createdAt" | "helpful" | "rating";
  }): Promise<{ reviews: Review[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = getDB();
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { productId, isActive: true };
    if (filter?.rating) query.rating = filter.rating;

    const sortOptions: Record<string, 1 | -1> = {};
    if (filter?.sortBy === "helpful") sortOptions.helpful = -1;
    else if (filter?.sortBy === "rating") sortOptions.rating = -1;
    else sortOptions.createdAt = -1;

    const [reviews, total] = await Promise.all([
      db.collection("reviews").find(query).sort(sortOptions).skip(skip).limit(limit).toArray(),
      db.collection("reviews").countDocuments(query),
    ]);

    return {
      reviews: reviews as Review[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findByUser(userId: string, limit: number = 10): Promise<Review[]> {
    const db = getDB();
    return db.collection("reviews")
      .find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray() as Promise<Review[]>;
  },

  async update(id: string, data: Partial<Omit<Review, "_id" | "createdAt" | "productId" | "userId">>): Promise<Review | null> {
    const db = getDB();
    const review = await this.findById(id);
    if (!review) return null;

    const result = await db.collection("reviews").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (data.rating !== undefined || data.isActive !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return result as Review | null;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDB();
    const review = await this.findById(id);
    if (!review) return false;

    const result = await db.collection("reviews").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      await this.updateProductRating(review.productId);
      return true;
    }
    return false;
  },

  async markHelpful(reviewId: string): Promise<void> {
    const db = getDB();
    await db.collection("reviews").updateOne({ _id: new ObjectId(reviewId) }, { $inc: { helpful: 1 } });
  },

  async markNotHelpful(reviewId: string): Promise<void> {
    const db = getDB();
    await db.collection("reviews").updateOne({ _id: new ObjectId(reviewId) }, { $inc: { notHelpful: 1 } });
  },

  async updateProductRating(productId: string): Promise<void> {
    const db = getDB();
    const agg = await db.collection("reviews").aggregate([
      { $match: { productId, isActive: true } },
      { $group: { _id: "$productId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]).toArray();

    if (agg.length > 0) {
      await db.collection("products").updateOne(
        { _id: new ObjectId(productId) },
        { $set: { rating: agg[0].avgRating, reviewCount: agg[0].count } }
      );
    } else {
      await db.collection("products").updateOne(
        { _id: new ObjectId(productId) },
        { $set: { rating: 0, reviewCount: 0 } }
      );
    }
  },

  async getRatingDistribution(productId: string): Promise<{ rating: number; count: number }[]> {
    const db = getDB();
    return db.collection("reviews").aggregate([
      { $match: { productId, isActive: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]).toArray() as Promise<{ rating: number; count: number }[]>;
  },
};
