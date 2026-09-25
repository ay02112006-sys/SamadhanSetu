// src/lib/challenge.ts
import { Db, Collection } from 'mongodb';
import { clientPromise } from './mongodb';
import { Challenge } from '@/types/challenge';

export const getChallengeCollection = async (): Promise<Collection<Challenge>> => {
  const db: Db = await clientPromise;
  const coll = db.collection<Challenge>('challenges');
  // Ensure required indexes (executed once per app start)
  await coll.createIndex({ challengeId: 1 }, { unique: true });
  await coll.createIndex({ submittedBy: 1 });
  await coll.createIndex({ createdAt: -1 });
  await coll.createIndex({ status: 1 });
  await coll.createIndex({ domain: 1 });
  await coll.createIndex({ submittedBy: 1, createdAt: -1 });
  return coll;
};
