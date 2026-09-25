// src/types/industry.ts

export type OrganizationType =
  | 'STARTUP'
  | 'MSME'
  | 'CORPORATE'
  | 'INDUSTRY_PARTNER'
  | 'CSR_ORGANIZATION'
  | 'RESEARCH_ORGANIZATION'
  | 'OTHER';

export type IndustrySector =
  | 'AGRICULTURE'
  | 'HEALTHCARE'
  | 'EDTECH'
  | 'FINTECH'
  | 'CLIMATE'
  | 'WATER'
  | 'ENERGY'
  | 'MANUFACTURING'
  | 'AI_ML'
  | 'SOFTWARE'
  | 'INFRASTRUCTURE'
  | 'MOBILITY'
  | 'SOCIAL_IMPACT'
  | 'RURAL_DEVELOPMENT'
  | 'OTHER';

export type SupportCapability =
  | 'MENTORSHIP'
  | 'FUNDING'
  | 'PROTOTYPING'
  | 'TESTING'
  | 'TECHNOLOGY'
  | 'PILOT_DEPLOYMENT'
  | 'IMPLEMENTATION'
  | 'MARKET_ACCESS'
  | 'DOMAIN_EXPERTISE'
  | 'OTHER';

export interface IndustryProfile {
  userId: string; // references the User._id
  organizationName: string;
  organizationType: OrganizationType;
  industrySector: IndustrySector;
  description: string;
  city: string;
  state: string;
  website?: string;
  email?: string;
  expertise: string[];
  technologies: string[];
  areasOfInterest: string[];
  supportCapabilities: SupportCapability[];
  companySize?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
