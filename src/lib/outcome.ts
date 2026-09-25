// src/lib/outcome.ts
import { Collection } from 'mongodb';
import clientPromise from './mongodb';
import { ProjectOutcome } from '@/types/project-outcome';

export async function getProjectOutcomeCollection(): Promise<Collection<ProjectOutcome>> {
  const db = await clientPromise;
  const coll = db.collection<ProjectOutcome>('project_outcomes');
  await coll.createIndex({ outcomeId: 1 }, { unique: true });
  await coll.createIndex({ projectId: 1 });
  await coll.createIndex({ outcomeType: 1 });
  return coll;
}
