// src/lib/university.ts
import { Collection } from 'mongodb';
import { clientPromise } from './mongodb';
import { UniversityMatch } from '@/types/university-match';
import { UniversityTeam } from '@/types/university-team';
import { User } from '@/types/user';

export const getUniversityMatchCollection = async (): Promise<Collection<UniversityMatch>> => {
  const db = await clientPromise;
  const coll = db.collection<UniversityMatch>('university_matches');
  
  await coll.createIndex({ challengeId: 1 });
  await coll.createIndex({ universityId: 1 });
  await coll.createIndex({ challengeId: 1, universityId: 1 }, { unique: true });
  await coll.createIndex({ score: -1 });
  
  return coll;
};

export const getUniversityTeamCollection = async (): Promise<Collection<UniversityTeam>> => {
  const db = await clientPromise;
  const coll = db.collection<UniversityTeam>('teams');
  
  await coll.createIndex({ teamId: 1 }, { unique: true });
  await coll.createIndex({ challengeId: 1 });
  await coll.createIndex({ universityId: 1 });
  await coll.createIndex({ challengeId: 1, universityId: 1 }, { unique: true });

  return coll;
};

export const getUsersCollection = async (): Promise<Collection<User>> => {
  const db = await clientPromise;
  const coll = db.collection<User>('users');
  return coll;
};
