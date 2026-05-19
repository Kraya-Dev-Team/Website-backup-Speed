import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDB } from "./Db.js";

export interface OTP {
  _id?: ObjectId;
  phone: string;
  email?: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

export const otpModel = {
  async create(phone: string, code: string): Promise<OTP> {
    const db = getDB();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = await bcrypt.hash(code, 10);

    await db.collection("otps").deleteMany({ phone });

    const otp: Omit<OTP, "_id"> = {
      phone,
      code: hashedCode,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: new Date(),
    };
    await db.collection("otps").insertOne(otp as any);
    return otp as OTP;
  },

  async findLatestByPhone(phone: string): Promise<OTP | null> {
    const db = getDB();
    const result = await db.collection("otps")
      .find({ phone })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    return result[0] as OTP | null;
  },

  async findLatestByEmail(email: string): Promise<OTP | null> {
    const db = getDB();
    const result = await db.collection("otps")
      .find({ email })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    return result[0] as OTP | null;
  },

  async createForEmail(email: string, code: string): Promise<OTP> {
    const db = getDB();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const hashedCode = await bcrypt.hash(code, 10);

    await db.collection("otps").deleteMany({ email });

    const otp: Omit<OTP, "_id"> & { email: string } = {
      phone: "",
      email,
      code: hashedCode,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: new Date(),
    };
    await db.collection("otps").insertOne(otp as any);
    return otp as OTP;
  },

  async verify(phone: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("otps").updateOne(
      { phone },
      { $set: { verified: true } }
    );
    return result.modifiedCount > 0;
  },

  async incrementAttempts(phone: string): Promise<void> {
    const db = getDB();
    await db.collection("otps").updateOne(
      { phone },
      { $inc: { attempts: 1 } }
    );
  },

  async cleanup(): Promise<void> {
    const db = getDB();
    const now = new Date();
    await db.collection("otps").deleteMany({
      $or: [{ expiresAt: { $lt: now } }, { verified: true }],
    });
  },
};
