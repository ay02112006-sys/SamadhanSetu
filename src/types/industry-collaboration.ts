// src/types/industry-collaboration.ts
import { SupportCapability } from './industry';

export type CollaborationStatus =
  | 'INITIATED'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IndustryCollaboration {
  _id?: string;
  collaborationId: string;
  projectId: string;
  universityId: string;
  industryId: string;
  interestId: string; // references the IndustryInterest that triggered creation

  status: CollaborationStatus;

  supportTypes: SupportCapability[];
  scope: string;
  objectives: string;

  startDate: Date;
  targetDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type CollaborationActivityType =
  | 'MENTORSHIP_SESSION'
  | 'FUNDING_COMMITMENT'
  | 'PROTOTYPE_SUPPORT'
  | 'TESTING_SUPPORT'
  | 'TECHNOLOGY_SUPPORT'
  | 'PILOT_SUPPORT'
  | 'IMPLEMENTATION_SUPPORT'
  | 'OTHER';

export type CollaborationActivityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CollaborationActivity {
  _id?: string;
  activityId: string;
  collaborationId: string;
  type: CollaborationActivityType;
  title: string;
  description: string;
  status: CollaborationActivityStatus;
  actorName: string;
  createdAt: Date;
  completedAt?: Date;
}

export type FundingStatus = 'PROPOSED' | 'COMMITTED' | 'RELEASED' | 'CANCELLED';

export interface FundingCommitment {
  _id?: string;
  fundingId: string;
  collaborationId: string;
  amount: number;
  currency: string;
  purpose: string;
  status: FundingStatus;
  committedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
