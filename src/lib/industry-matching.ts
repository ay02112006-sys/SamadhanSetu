// src/lib/industry-matching.ts
// Deterministic matching engine for industry-project collaboration.
// NO Math.random() — all scores are deterministic from data.

import { IndustryProfile, IndustrySector, SupportCapability } from '@/types/industry';
import { Project, ProjectStatus } from '@/types/project';
import { Challenge } from '@/types/challenge';
import { IndustryProjectMatch } from '@/types/industry-match';

// Map challenge domains to relevant industry sectors
const DOMAIN_TO_SECTOR_MAP: Record<string, IndustrySector[]> = {
  EDUCATION: ['EDTECH', 'SOCIAL_IMPACT', 'SOFTWARE'],
  HEALTHCARE: ['HEALTHCARE', 'AI_ML', 'SOFTWARE'],
  AGRICULTURE: ['AGRICULTURE', 'RURAL_DEVELOPMENT', 'CLIMATE', 'WATER'],
  WATER: ['WATER', 'INFRASTRUCTURE', 'CLIMATE', 'RURAL_DEVELOPMENT'],
  SANITATION: ['INFRASTRUCTURE', 'RURAL_DEVELOPMENT', 'SOCIAL_IMPACT'],
  ENVIRONMENT: ['CLIMATE', 'ENERGY', 'WATER', 'AGRICULTURE'],
  RURAL_LIVELIHOODS: ['RURAL_DEVELOPMENT', 'AGRICULTURE', 'SOCIAL_IMPACT', 'FINTECH'],
  ACCESSIBILITY: ['SOFTWARE', 'SOCIAL_IMPACT', 'MOBILITY', 'AI_ML'],
  URBAN_INFRASTRUCTURE: ['INFRASTRUCTURE', 'MOBILITY', 'MANUFACTURING', 'ENERGY'],
  PUBLIC_SERVICES: ['SOFTWARE', 'SOCIAL_IMPACT', 'AI_ML', 'INFRASTRUCTURE'],
  OTHER: ['OTHER'],
};

// Status weights: projects in active phases score higher
const ELIGIBLE_PROJECT_STATUSES: ProjectStatus[] = [
  'PLANNING',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'TESTING',
];

const normalize = (s: string) => s.toLowerCase().trim().replace(/_/g, ' ');

const hasTextOverlap = (arr: string[], text: string): boolean => {
  const normText = normalize(text);
  return arr.some(
    (item) =>
      normalize(item).includes(normText) || normText.includes(normalize(item))
  );
};

const arrayOverlap = (a: string[], b: string[]): string[] => {
  const normB = b.map(normalize);
  return a.filter((item) => normB.some((bi) => normalize(item) === bi || normalize(item).includes(bi) || bi.includes(normalize(item))));
};

export interface IndustryMatchInput {
  industry: IndustryProfile;
  project: Project;
  challenge: Challenge;
}

export function calculateIndustryMatch(
  input: IndustryMatchInput
): Omit<IndustryProjectMatch, '_id' | 'status' | 'createdAt' | 'updatedAt'> {
  const { industry, project, challenge } = input;

  if (!ELIGIBLE_PROJECT_STATUSES.includes(project.status)) {
    // Return zero score for ineligible projects
    return {
      projectId: project.projectId,
      industryId: industry.userId,
      score: 0,
      reasons: ['Project is not in an eligible status for collaboration.'],
      matchedAreas: [],
      matchedExpertise: [],
      matchedTechnologies: [],
      matchedCapabilities: [],
      confidence: 0,
    };
  }

  const reasons: string[] = [];
  const matchedAreas: string[] = [];
  const matchedExpertise: string[] = [];
  const matchedTechnologies: string[] = [];
  const matchedCapabilities: SupportCapability[] = [];

  let score = 0;

  // 1. Sector compatibility (25%)
  const relevantSectors: IndustrySector[] = DOMAIN_TO_SECTOR_MAP[challenge.domain] ?? ['OTHER'];
  if (relevantSectors.includes(industry.industrySector)) {
    score += 25;
    reasons.push(`Strong sector alignment: ${industry.industrySector} matches ${challenge.domain} domain.`);
    matchedAreas.push(industry.industrySector);
  } else {
    // Partial: check if social impact / other general sectors
    if (['SOCIAL_IMPACT', 'AI_ML', 'SOFTWARE'].includes(industry.industrySector)) {
      score += 8;
      reasons.push(`General sector relevance: ${industry.industrySector} can contribute across domains.`);
    }
  }

  // 2. Area of interest match (20%)
  const challengeDomainWords = [challenge.domain, ...(challenge.aiAnalysis?.keywords ?? [])];
  const areaMatches = industry.areasOfInterest.filter((area) =>
    challengeDomainWords.some((word) => hasTextOverlap([area], word))
  );
  if (areaMatches.length > 0) {
    const areaScore = Math.min(20, areaMatches.length * 8);
    score += areaScore;
    matchedAreas.push(...areaMatches);
    reasons.push(`Areas of interest match: ${areaMatches.slice(0, 3).join(', ')}.`);
  }

  // 3. Expertise match (20%)
  const projectKeywords = [
    ...(challenge.aiAnalysis?.routingSignals ?? []),
    ...(challenge.aiAnalysis?.relevantExpertise ?? []),
    challenge.domain,
  ];
  const expertiseMatches = arrayOverlap(industry.expertise, projectKeywords);
  if (expertiseMatches.length > 0) {
    const expScore = Math.min(20, expertiseMatches.length * 7);
    score += expScore;
    matchedExpertise.push(...expertiseMatches);
    reasons.push(`Industry expertise aligns: ${expertiseMatches.slice(0, 3).join(', ')}.`);
  }

  // 4. Technology match (15%)
  const allProjectTech = [
    ...(challenge.aiAnalysis?.suggestedTags ?? []),
    ...(challenge.aiAnalysis?.keywords ?? []),
  ];
  const techMatches = arrayOverlap(industry.technologies, allProjectTech);
  if (techMatches.length > 0) {
    const techScore = Math.min(15, techMatches.length * 6);
    score += techScore;
    matchedTechnologies.push(...techMatches);
    reasons.push(`Relevant technologies: ${techMatches.slice(0, 3).join(', ')}.`);
  }

  // 5. Support capability relevance (10%)
  // Projects in PLANNING need MENTORSHIP/FUNDING, later stages need TESTING/IMPLEMENTATION
  const highValueCapabilities: Record<ProjectStatus, SupportCapability[]> = {
    PLANNING: ['MENTORSHIP', 'FUNDING', 'DOMAIN_EXPERTISE'],
    IN_PROGRESS: ['MENTORSHIP', 'PROTOTYPING', 'TECHNOLOGY', 'FUNDING'],
    UNDER_REVIEW: ['DOMAIN_EXPERTISE', 'MENTORSHIP'],
    TESTING: ['TESTING', 'PILOT_DEPLOYMENT', 'TECHNOLOGY'],
    ON_HOLD: ['FUNDING', 'MENTORSHIP'],
    COMPLETED: ['IMPLEMENTATION', 'MARKET_ACCESS', 'PILOT_DEPLOYMENT'],
    CANCELLED: [],
  };

  const neededCaps = highValueCapabilities[project.status] ?? [];
  const capMatches = industry.supportCapabilities.filter((cap) => neededCaps.includes(cap));
  if (capMatches.length > 0) {
    const capScore = Math.min(10, capMatches.length * 4);
    score += capScore;
    matchedCapabilities.push(...capMatches);
    reasons.push(`Can provide: ${capMatches.join(', ')}.`);
  }

  // 6. Challenge domain keyword match (10%)
  const domainScore = hasTextOverlap(industry.areasOfInterest, challenge.domain) ? 10 : 0;
  score += domainScore;
  if (domainScore > 0) {
    reasons.push(`Direct interest in ${challenge.domain} domain.`);
  }

  // Cap at 100
  score = Math.min(100, score);

  // Confidence: normalized 0–1
  const confidence = parseFloat((score / 100).toFixed(2));

  if (reasons.length === 0) {
    reasons.push('Potential collaboration based on general alignment.');
  }

  return {
    projectId: project.projectId,
    industryId: industry.userId,
    score,
    reasons,
    matchedAreas: [...new Set(matchedAreas)],
    matchedExpertise: [...new Set(matchedExpertise)],
    matchedTechnologies: [...new Set(matchedTechnologies)],
    matchedCapabilities: [...new Set(matchedCapabilities)],
    confidence,
  };
}
