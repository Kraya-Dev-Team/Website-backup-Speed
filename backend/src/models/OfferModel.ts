import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export type OfferType = "percentage" | "flat" | "buy_x_get_y" | "cart_value";

export interface OfferTargeting {
  // User segment
  newUsersOnly?: boolean;         // Only users with zero completed orders
  minOrderCount?: number;         // User must have at least N completed orders
  maxOrderCount?: number;         // User must have fewer than N completed orders
  minTotalSpent?: number;         // User must have spent at least ₹N total
  inactiveDaysSince?: number;     // Re-engagement: user hasn't ordered in X+ days

  // Purchase history preferences (any-match within each array)
  targetProductTypes?: string[];  // e.g. ["perfume", "attar"]
  targetCategories?: string[];    // category names user has bought from
  targetBrands?: string[];        // brand names user has bought from
  targetGenders?: ("men" | "women" | "unisex")[];

  // Location (any-match; if array is non-empty and user has no address, offer is hidden)
  targetCities?: string[];
  targetStates?: string[];
  targetPincodes?: string[];

  // Time window (IST, 0-23)
  targetDaysOfWeek?: number[];    // 0=Sun … 6=Sat
  targetHourStart?: number;       // inclusive
  targetHourEnd?: number;         // exclusive
}

export interface Offer {
  _id?: ObjectId;
  code: string;
  title: string;
  description?: string;
  type: OfferType;

  // type: percentage
  discountPercentage?: number;
  maxDiscountAmount?: number;

  // type: flat
  discountAmount?: number;

  // type: buy_x_get_y
  buyQuantity?: number;
  getQuantity?: number;

  // type: cart_value
  minCartValue?: number;
  cartDiscountAmount?: number;

  // common constraints
  minOrderValue?: number;
  maxUsageCount?: number;
  usageCount: number;
  maxUsagePerUser?: number;

  isActive: boolean;
  startDate?: Date;
  endDate?: Date;

  // personalization targeting rules (undefined = universal)
  targeting?: OfferTargeting;

  createdAt: Date;
  updatedAt: Date;
}

export interface OfferUsage {
  _id?: ObjectId;
  offerId: string;
  userId: string;
  orderId: string;
  discount: number;
  usedAt: Date;
}

export const offerModel = {
  async create(data: Omit<Offer, "_id" | "usageCount" | "createdAt" | "updatedAt">): Promise<Offer> {
    const db = getDB();
    const now = new Date();
    const offer: Offer = {
      ...data,
      code: data.code.toUpperCase().trim(),
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("offers").insertOne(offer as any);
    return offer;
  },

  async findByCode(code: string): Promise<Offer | null> {
    const db = getDB();
    return db.collection("offers").findOne({ code: code.toUpperCase().trim() }) as Promise<Offer | null>;
  },

  async findById(id: string): Promise<Offer | null> {
    const db = getDB();
    return db.collection("offers").findOne({ _id: new ObjectId(id) }) as Promise<Offer | null>;
  },

  async list(filter?: { isActive?: boolean; page?: number; limit?: number }): Promise<{ offers: Offer[]; total: number }> {
    const db = getDB();
    const page = filter?.page || 1;
    const limit = filter?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;

    const [offers, total] = await Promise.all([
      db.collection("offers").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("offers").countDocuments(query),
    ]);

    return { offers: offers as Offer[], total };
  },

  async update(id: string, data: Partial<Omit<Offer, "_id" | "createdAt">>): Promise<Offer | null> {
    const db = getDB();
    if (data.code) data.code = data.code.toUpperCase().trim();
    const result = await db.collection("offers").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as Offer | null;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("offers").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  },

  async incrementUsage(id: string): Promise<void> {
    const db = getDB();
    await db.collection("offers").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { usageCount: 1 }, $set: { updatedAt: new Date() } }
    );
  },

  async getUserUsageCount(offerId: string, userId: string): Promise<number> {
    const db = getDB();
    return db.collection("offer_usages").countDocuments({ offerId, userId });
  },

  async recordUsage(usage: Omit<OfferUsage, "_id" | "usedAt">): Promise<void> {
    const db = getDB();
    await db.collection("offer_usages").insertOne({ ...usage, usedAt: new Date() } as any);
  },
};

export function calculateDiscount(
  offer: Offer,
  subtotal: number,
  cartItems: Array<{ price: number; quantity: number }>
): number {
  switch (offer.type) {
    case "percentage": {
      if (offer.minOrderValue && subtotal < offer.minOrderValue) return 0;
      const discount = (subtotal * (offer.discountPercentage ?? 0)) / 100;
      return parseFloat(
        (offer.maxDiscountAmount ? Math.min(discount, offer.maxDiscountAmount) : discount).toFixed(2)
      );
    }

    case "flat": {
      if (offer.minOrderValue && subtotal < offer.minOrderValue) return 0;
      return Math.min(offer.discountAmount ?? 0, subtotal);
    }

    case "cart_value": {
      if (!offer.minCartValue || subtotal < offer.minCartValue) return 0;
      return Math.min(offer.cartDiscountAmount ?? 0, subtotal);
    }

    case "buy_x_get_y": {
      const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (!offer.buyQuantity || totalQty < offer.buyQuantity) return 0;
      // Expand into individual item prices and sort ascending (cheapest first)
      const prices = cartItems
        .flatMap((item) => Array(item.quantity).fill(item.price))
        .sort((a, b) => a - b);
      const freeCount = offer.getQuantity ?? 0;
      return parseFloat(
        prices.slice(0, freeCount).reduce((sum: number, p: number) => sum + p, 0).toFixed(2)
      );
    }

    default:
      return 0;
  }
}

export function validateOfferEligibility(
  offer: Offer,
  subtotal: number,
  now: Date = new Date()
): { valid: boolean; reason?: string } {
  if (!offer.isActive) return { valid: false, reason: "Offer is not active" };

  if (offer.startDate && now < offer.startDate)
    return { valid: false, reason: "Offer has not started yet" };

  if (offer.endDate && now > offer.endDate)
    return { valid: false, reason: "Offer has expired" };

  if (offer.maxUsageCount !== undefined && offer.usageCount >= offer.maxUsageCount)
    return { valid: false, reason: "Offer usage limit reached" };

  if (offer.minOrderValue && subtotal < offer.minOrderValue)
    return {
      valid: false,
      reason: `Minimum order value of ₹${offer.minOrderValue} required`,
    };

  if (offer.type === "cart_value" && offer.minCartValue && subtotal < offer.minCartValue)
    return {
      valid: false,
      reason: `Minimum cart value of ₹${offer.minCartValue} required`,
    };

  return { valid: true };
}
