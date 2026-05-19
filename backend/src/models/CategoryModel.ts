import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface CategoryImage {
  url: string;
  alt?: string;
}

export interface Category {
  _id?: ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: CategoryImage;
  
  parentId?: string;
  level: number;
  
  isFeatured: boolean;
  isActive: boolean;
  
  productCount: number;
  
  metaTitle?: string;
  metaDescription?: string;
  
  order: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export const categoryModel = {
  async create(data: Omit<Category, "_id" | "createdAt" | "updatedAt" | "productCount" | "level">): Promise<Category> {
    const db = getDB();
    const now = new Date();
    
    let level = 1;
    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      level = parent ? parent.level + 1 : 1;
    }
    
    const category: Category = {
      ...data,
      level,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("categories").insertOne(category as any);
    return category;
  },

  async findById(id: string): Promise<Category | null> {
    const db = getDB();
    return db.collection("categories").findOne({ _id: new ObjectId(id) }) as Promise<Category | null>;
  },

  async findBySlug(slug: string): Promise<Category | null> {
    const db = getDB();
    return db.collection("categories").findOne({ slug, isActive: true }) as Promise<Category | null>;
  },

  async findChildren(parentId: string): Promise<Category[]> {
    const db = getDB();
    return db.collection("categories")
      .find({ parentId, isActive: true })
      .sort({ order: 1 })
      .toArray() as Promise<Category[]>;
  },

  async findRootCategories(): Promise<Category[]> {
    const db = getDB();
    return db.collection("categories")
      .find({ parentId: { $exists: false }, isActive: true })
      .sort({ order: 1 })
      .toArray() as Promise<Category[]>;
  },

  async findAll(filter?: { isFeatured?: boolean; isActive?: boolean }): Promise<Category[]> {
    const db = getDB();
    const query: Record<string, any> = {};
    if (filter?.isFeatured !== undefined) query.isFeatured = filter.isFeatured;
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    return db.collection("categories").find(query).sort({ order: 1 }).toArray() as Promise<Category[]>;
  },

  async getTree(): Promise<(Category & { children: Category[] })[]> {
    const rootCategories = await this.findRootCategories();
    const result: (Category & { children: Category[] })[] = [];
    
    for (const category of rootCategories) {
      const children = await this.findChildren(category._id!.toString());
      result.push({ ...category, children });
    }
    
    return result;
  },

  async update(id: string, data: Partial<Omit<Category, "_id" | "createdAt" | "productCount" | "level">>): Promise<Category | null> {
    const db = getDB();
    const result = await db.collection("categories").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as Category | null;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDB();
    const children = await this.findChildren(id);
    if (children.length > 0) return false;
    
    const result = await db.collection("categories").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },

  async updateProductCount(id: string, delta: number): Promise<void> {
    const db = getDB();
    await db.collection("categories").updateOne({ _id: new ObjectId(id) }, { $inc: { productCount: delta } });
  },
};
