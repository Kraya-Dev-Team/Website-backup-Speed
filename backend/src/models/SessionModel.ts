import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface Session {
  _id?: ObjectId;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  createdAt: Date;
}

export const sessionModel = {
  async create(userId: string, refreshToken: string, userAgent?: string, ip?: string): Promise<Session> {
    const db = getDB();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session: Omit<Session, "_id"> = {
      userId,
      refreshToken,
      userAgent,
      ip,
      expiresAt,
      createdAt: new Date(),
    };
    await db.collection("sessions").insertOne(session as any);
    return session as Session;
  },

  async findById(id: string): Promise<Session | null> {
    const db = getDB();
    return db.collection("sessions").findOne({ _id: new ObjectId(id) }) as Promise<Session | null>;
  },

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const db = getDB();
    return db.collection("sessions").findOne({ refreshToken }) as Promise<Session | null>;
  },

  async findByUserId(userId: string): Promise<Session[]> {
    const db = getDB();
    return db.collection("sessions")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray() as Promise<Session[]>;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("sessions").deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  },

  async deleteByUserId(userId: string): Promise<number> {
    const db = getDB();
    const result = await db.collection("sessions").deleteMany({ userId });
    return result.deletedCount;
  },

  async cleanup(): Promise<void> {
    const db = getDB();
    await db.collection("sessions").deleteMany({
      expiresAt: { $lt: new Date() },
    });
  },
};
