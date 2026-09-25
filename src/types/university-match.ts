// src/types/university-match.ts
export type MatchStatus = 'SUGGESTED' | 'VIEWED' | 'SHORTLISTED' | 'ACCEPTED' | 'DECLINED';

export interface UniversityMatch {
  _id?: string;
  challengeId: string;
  universityId: string;
  score: number;
  reasons: string[];
  matchedDomains: string[];
  matchedResearchAreas: string[];
  matchedExpertise: string[];
  locationRelevance: string;
  confidence: number;
  status: MatchStatus;
  createdAt: Date;
  updatedAt: Date;
}
