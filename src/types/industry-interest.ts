// src/types/industry-interest.ts
import { SupportCapability } from './industry';

export type InterestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface IndustryInterest {
  _id?: string;
  interestId: string;
  projectId: string;
  industryId: string; // User._id of the INDUSTRY user
  universityId: string; // User._id of the UNIVERSITY user who owns the project
  supportTypes: SupportCapability[];
  message?: string;
  proposedContribution: string;
  status: InterestStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // User._id of the university reviewer
}
