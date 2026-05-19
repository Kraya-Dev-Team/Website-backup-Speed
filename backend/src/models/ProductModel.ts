import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface PerfumeNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductVariant {
  id: string;
  size: string;
  unit: string;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  stock: number;
  sku: string;
  isAvailable: boolean;
  isDefault?: boolean;
}

export interface ShippingInfo {
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  freeShipping?: boolean;
  shippingTime?: string;
}

export interface Product {
  _id?: ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  brand: {
    id: string;
    name: string;
  };
  
  category: {
    id: string;
    name: string;
  };
  
  type: "perfume" | "attar" | "oil" | "body-spray" | "deodorant" | "gift-set" | "other";
  gender: "men" | "women" | "unisex";
  
  perfumeNotes: PerfumeNotes;
  concentration: "eau-de-parfum" | "eau-de-toilette" | "eau-de-cologne" | "parfum" | " extraits" | "body-mist";
  season: "spring" | "summer" | "fall" | "winter" | "all-season";
  mood?: string[];
  
  images: ProductImage[];
  variants: ProductVariant[];
  
  basePrice: number;
  discountPrice?: number;
  discountPercentage?: number;
  
  rating: number;
  reviewCount: number;
  
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isActive: boolean;
  isArchived: boolean;
  
  tags: string[];
  
  shipping: ShippingInfo;
  
  metaTitle?: string;
  metaDescription?: string;
  
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export const productModel = {
  async create(data: Omit<Product, "_id" | "createdAt" | "updatedAt">): Promise<Product> {
    const db = getDB();
    const now = new Date();
    const product: Product = {
      ...data,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.isActive ? now : undefined,
    };
    await db.collection("products").insertOne(product as any);
    return product;
  },

  async findById(id: string): Promise<Product | null> {
    const db = getDB();
    return db.collection("products").findOne({ _id: new ObjectId(id) }) as Promise<Product | null>;
  },

  async findBySlug(slug: string): Promise<Product | null> {
    const db = getDB();
    return db.collection("products").findOne({ slug, isArchived: false }) as Promise<Product | null>;
  },

  async findBySku(sku: string): Promise<Product | null> {
    const db = getDB();
    return db.collection("products").findOne({ "variants.sku": sku }) as Promise<Product | null>;
  },

  async update(id: string, data: Partial<Omit<Product, "_id" | "createdAt">>): Promise<Product | null> {
    const db = getDB();
    const result = await db.collection("products").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as Product | null;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },

  async archive(id: string): Promise<Product | null> {
    return this.update(id, { isArchived: true });
  },

  async list(filter: {
    page?: number;
    limit?: number;
    brand?: string;
    category?: string;
    type?: string;
    gender?: string;
    season?: string;
    concentration?: string;
    minPrice?: number;
    maxPrice?: number;
    isFeatured?: boolean;
    isNew?: boolean;
    isBestseller?: boolean;
    isActive?: boolean;
    search?: string;
    sortBy?: "price" | "createdAt" | "rating" | "name" | "popularity";
    sortOrder?: "asc" | "desc";
  }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = getDB();
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { isArchived: false };

    if (filter.brand) query["brand.id"] = filter.brand;
    if (filter.category) query["category.id"] = filter.category;
    if (filter.type) query.type = filter.type;
    if (filter.gender) query.gender = filter.gender;
    if (filter.season) query.season = filter.season;
    if (filter.concentration) query.concentration = filter.concentration;
    if (filter.isFeatured !== undefined) query.isFeatured = filter.isFeatured;
    if (filter.isNew !== undefined) query.isNew = filter.isNew;
    if (filter.isBestseller !== undefined) query.isBestseller = filter.isBestseller;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.basePrice = {};
      if (filter.minPrice !== undefined) query.basePrice.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) query.basePrice.$lte = filter.maxPrice;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { description: { $regex: filter.search, $options: "i" } },
        { tags: { $in: [new RegExp(filter.search, "i")] } },
        { "brand.name": { $regex: filter.search, $options: "i" } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (filter.sortBy) {
      const sortField = filter.sortBy === "popularity" ? "reviewCount" : filter.sortBy;
      sortOptions[sortField] = filter.sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [products, total] = await Promise.all([
      db.collection("products").find(query).sort(sortOptions).skip(skip).limit(limit).toArray(),
      db.collection("products").countDocuments(query),
    ]);

    return {
      products: products as Product[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getSimilar(productId: string, limit: number = 5): Promise<Product[]> {
    const product = await this.findById(productId);
    if (!product) return [];

    const db = getDB();
    return db.collection("products")
      .find({
        _id: { $ne: new ObjectId(productId) },
        isArchived: false,
        isActive: true,
        $or: [
          { "brand.id": product.brand.id },
          { gender: product.gender },
          { category: product.category },
          { type: product.type },
        ],
      })
      .limit(limit)
      .toArray() as Promise<Product[]>;
  },

  async incrementView(id: string): Promise<void> {
    const db = getDB();
    await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $inc: { viewCount: 1 } });
  },

  async updateStock(id: string, variantId: string, quantity: number): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id), "variants.id": variantId },
      { $inc: { "variants.$.stock": quantity } }
    );
    return result.modifiedCount === 1;
  },

  async bulkCreate(products: Omit<Product, "_id" | "createdAt" | "updatedAt">[]): Promise<Product[]> {
    const db = getDB();
    const now = new Date();
    const docs = products.map((p) => ({
      ...p,
      createdAt: now,
      updatedAt: now,
    }));
    await db.collection("products").insertMany(docs as any);
    return docs as Product[];
  },
};