import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export type UserRole = "admin" | "customer";

export interface User {
  _id?: ObjectId;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const userModel = {
  async create(phone: string, role: UserRole = "customer"): Promise<User> {
    const db = getDB();
    const now = new Date();
    const user: Omit<User, "_id"> = {
      phone,
      role,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("users").insertOne(user as any);
    return user as User;
  },

  async findById(id: string): Promise<User | null> {
    const db = getDB();
    return db.collection("users").findOne({ _id: new ObjectId(id) }) as Promise<User | null>;
  },

  async findByPhone(phone: string): Promise<User | null> {
    const db = getDB();
    return db.collection("users").findOne({ phone }) as Promise<User | null>;
  },

  async findByEmail(email: string): Promise<User | null> {
    const db = getDB();
    return db.collection("users").findOne({ email: email.toLowerCase() }) as Promise<User | null>;
  },

  async update(id: string, data: Partial<Omit<User, "_id" | "createdAt" | "updatedAt">>): Promise<User | null> {
    const db = getDB();
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as User | null;
  },

  async setEmail(id: string, email: string): Promise<User | null> {
    const db = getDB();
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { email: email.toLowerCase(), isVerified: true, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as User | null;
  },
};
