// src/types/challenge.ts
export type ChallengeStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VALIDATED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type ChallengePriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type ChallengeDomain =
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'AGRICULTURE'
  | 'WATER'
  | 'SANITATION'
  | 'ENVIRONMENT'
  | 'RURAL_LIVELIHOODS'
  | 'ACCESSIBILITY'
  | 'URBAN_INFRASTRUCTURE'
  | 'PUBLIC_SERVICES'
  | 'OTHER';

export interface ChallengeLocation {
  state?: string;
  district?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ChallengeAttachment {
  filename: string;
  contentType: string;
  // Future: URL after upload
  url?: string;
}

export interface Challenge {
  _id?: string; // MongoDB ObjectId as string
  challengeId: string; // Human-friendly ID, e.g., SAM-26001
  title: string;
  description: string;
  domain: ChallengeDomain;
  location: ChallengeLocation;
  attachments?: ChallengeAttachment[];
  status: ChallengeStatus;
  priority: ChallengePriority;
  submittedBy: string; // user _id
  submittedByName: string;
  createdAt: Date;
  updatedAt: Date;
  // Future fields (optional)
  aiCategory?: string | null;
  aiPriority?: string | null;
  aiDuplicateOf?: string | null;
  // New AI analysis field
  aiAnalysis?: import("./ai-analysis").AIChallengeAnalysis | null;
  matchedUniversities?: string[];
  assignedUniversity?: string | null;
  assignedIndustry?: string | null;
  projectId?: string | null;
  statusHistory?: { status: ChallengeStatus; timestamp: Date }[];
}
