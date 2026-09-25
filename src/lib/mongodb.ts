// src/lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

// mongoClientPromise: used by MongoDBAdapter (needs Promise<MongoClient>)
export const mongoClientPromise: Promise<MongoClient> = (async () => {
  if (mongoClient) return mongoClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable.");
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  return mongoClient;
})();

// clientPromise: used by API routes (resolves to Db for convenience)
export const clientPromise: Promise<Db> = (async () => {
  if (db) return db;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!dbName) throw new Error("Missing MONGODB_DB_NAME environment variable.");
  const client = await mongoClientPromise;
  db = client.db(dbName);
  return db;
})();

// Default export for compatibility with: import clientPromise from '@/lib/mongodb'
export default clientPromise;
