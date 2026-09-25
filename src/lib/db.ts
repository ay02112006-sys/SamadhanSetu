// src/lib/db.ts
import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    throw new Error("Missing MongoDB configuration in environment variables.");
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
};

export const getUserCollection = async () => {
  const database = await connectToDatabase();
  return database.collection("users");
};
