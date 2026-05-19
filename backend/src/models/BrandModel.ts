import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface BrandLogo {
  url: string;
  alt?: string;
}

export interface BrandSocial {
  platform: string;
  url: string;
}

export interface Brand {
  _id?: ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: BrandLogo;
  
  country?: string;
  founded?: number;
  website?: string;
  
  socials?: BrandSocial[];
  
  isFeatured: boolean;
  isActive: boolean;
  
  productCount: number;
  
  metaTitle?: string;
  metaDescription?: string;
  
  order: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export const brandModel = {
  async create(data: Omit<Brand, "_id" | "createdAt" | "updatedAt" | "productCount">): Promise<Brand> {
    const db = getDB();
    const now = new Date();
    const brand: Brand = {
      ...data,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("brands").insertOne(brand as any);
    return brand;
  },

  async findById(id: string): Promise<Brand | null> {
    const db = getDB();
    return db.collection("brands").findOne({ _id: new ObjectId(id) }) as Promise<Brand | null>;
  },

  async findBySlug(slug: string): Promise<Brand | null> {
    const db = getDB();
    return db.collection("brands").findOne({ slug, isActive: true }) as Promise<Brand | null>;
  },

  async findAll(filter?: { isFeatured?: boolean; isActive?: boolean }): Promise<Brand[]> {
    const db = getDB();
    const query: Record<string, any> = {};
    if (filter?.isFeatured !== undefined) query.isFeatured = filter.isFeatured;
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    return db.collection("brands").find(query).sort({ order: 1 }).toArray() as Promise<Brand[]>;
  },

  async update(id: string, data: Partial<Omit<Brand, "_id" | "createdAt" | "productCount">>): Promise<Brand | null> {
    const db = getDB();
    const result = await db.collection("brands").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as Brand | null;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("brands").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },

  async updateProductCount(id: string, delta: number): Promise<void> {
    const db = getDB();
    await db.collection("brands").updateOne({ _id: new ObjectId(id) }, { $inc: { productCount: delta } });
  },
};
