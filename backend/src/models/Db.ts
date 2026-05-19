import { MongoClient, Db } from "mongodb";
import { config } from "../config/index.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectDB = async (): Promise<Db> => {
  if (db) return db;

  client = new MongoClient(config.mongodb.uri);
  await client.connect();
  db = client.db();

  await db.collection("users").createIndex({ phone: 1 }, { unique: true });
  await db.collection("otps").createIndex({ phone: 1, createdAt: -1 });
  await db.collection("sessions").createIndex({ userId: 1 });
  await db.collection("sessions").createIndex({ refreshToken: 1 });

  return db;
};

export const getDB = (): Db => {
  if (!db) throw new Error("Database not connected");
  return db;
};

export const closeDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};
