import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface Address {
  _id?: ObjectId;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const addressModel = {
  async create(data: Omit<Address, "_id" | "createdAt" | "updatedAt">): Promise<Address> {
    const db = getDB();
    const now = new Date();

    if (data.isDefault) {
      await db.collection("addresses").updateMany({ userId: data.userId }, { $set: { isDefault: false } });
    }

    const address: Address = {
      ...data,
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("addresses").insertOne(address as any);
    return address;
  },

  async findById(id: string): Promise<Address | null> {
    const db = getDB();
    return db.collection("addresses").findOne({ _id: new ObjectId(id) }) as Promise<Address | null>;
  },

  async findByUserId(userId: string): Promise<Address[]> {
    const db = getDB();
    return db.collection("addresses").find({ userId }).sort({ createdAt: -1 }).toArray() as Promise<Address[]>;
  },

  async update(id: string, userId: string, data: Partial<Omit<Address, "_id" | "userId" | "createdAt">>): Promise<Address | null> {
    const db = getDB();
    
    if (data.isDefault) {
      await db.collection("addresses").updateMany({ userId, _id: { $ne: new ObjectId(id) } }, { $set: { isDefault: false } });
    }

    const result = await db.collection("addresses").findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as Address | null;
  },

  async setAsDefault(id: string, userId: string): Promise<boolean> {
    const db = getDB();
    await db.collection("addresses").updateMany({ userId }, { $set: { isDefault: false } });
    const result = await db.collection("addresses").updateOne({ _id: new ObjectId(id), userId }, { $set: { isDefault: true, updatedAt: new Date() } });
    return result.modifiedCount > 0;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("addresses").deleteOne({ _id: new ObjectId(id), userId });
    return result.deletedCount === 1;
  }
};
