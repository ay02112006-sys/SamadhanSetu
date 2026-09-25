// src/lib/industry.ts
import { Collection } from 'mongodb';
import { clientPromise } from './mongodb';
import { IndustryProfile } from '@/types/industry';
import { IndustryProjectMatch } from '@/types/industry-match';
import { IndustryInterest } from '@/types/industry-interest';
import {
  IndustryCollaboration,
  CollaborationActivity,
  FundingCommitment,
} from '@/types/industry-collaboration';

export async function getIndustryProfileCollection(): Promise<Collection<IndustryProfile>> {
  const db = await clientPromise;
  const coll = db.collection<IndustryProfile>('industry_profiles');
  await coll.createIndex({ userId: 1 }, { unique: true });
  return coll;
}

export async function getIndustryMatchCollection(): Promise<Collection<IndustryProjectMatch>> {
  const db = await clientPromise;
  const coll = db.collection<IndustryProjectMatch>('industry_project_matches');
  await coll.createIndex({ projectId: 1 });
  await coll.createIndex({ industryId: 1 });
  await coll.createIndex({ projectId: 1, industryId: 1 }, { unique: true });
  await coll.createIndex({ score: -1 });
  return coll;
}

export async function getIndustryInterestCollection(): Promise<Collection<IndustryInterest>> {
  const db = await clientPromise;
  const coll = db.collection<IndustryInterest>('industry_interests');
  await coll.createIndex({ projectId: 1 });
  await coll.createIndex({ industryId: 1 });
  await coll.createIndex({ universityId: 1 });
  await coll.createIndex({ status: 1 });
  await coll.createIndex({ interestId: 1 }, { unique: true });
  return coll;
}

export async function getIndustryCollaborationCollection(): Promise<Collection<IndustryCollaboration>> {
  const db = await clientPromise;
  const coll = db.collection<IndustryCollaboration>('industry_collaborations');
  await coll.createIndex({ projectId: 1 });
  await coll.createIndex({ industryId: 1 });
  await coll.createIndex({ universityId: 1 });
  await coll.createIndex({ projectId: 1, industryId: 1 }, { unique: true });
  await coll.createIndex({ collaborationId: 1 }, { unique: true });
  return coll;
}

export async function getCollaborationActivityCollection(): Promise<Collection<CollaborationActivity>> {
  const db = await clientPromise;
  const coll = db.collection<CollaborationActivity>('collaboration_activities');
  await coll.createIndex({ collaborationId: 1 });
  await coll.createIndex({ createdAt: -1 });
  await coll.createIndex({ activityId: 1 }, { unique: true });
  return coll;
}

export async function getFundingCommitmentCollection(): Promise<Collection<FundingCommitment>> {
  const db = await clientPromise;
  const coll = db.collection<FundingCommitment>('funding_commitments');
  await coll.createIndex({ collaborationId: 1 });
  await coll.createIndex({ fundingId: 1 }, { unique: true });
  return coll;
}
