// src/types/industry-match.ts
import { SupportCapability } from './industry';

export type IndustryMatchStatus = 'SUGGESTED' | 'VIEWED' | 'INTERESTED' | 'DECLINED';

export interface IndustryProjectMatch {
  _id?: string;
  projectId: string;
  industryId: string; // User._id of the industry user
  score: number; // 0–100
  reasons: string[];
  matchedAreas: string[];
  matchedExpertise: string[];
  matchedTechnologies: string[];
  matchedCapabilities: SupportCapability[];
  confidence: number; // 0–1
  status: IndustryMatchStatus;
  createdAt: Date;
  updatedAt: Date;
}
