// src/lib/university-matching.ts
import { Challenge } from '@/types/challenge';
import { AIChallengeAnalysis } from '@/types/ai-analysis';
import { User } from '@/types/user';
import { UniversityMatch } from '@/types/university-match';

/**
 * Calculates a match score between a challenge (with its AI analysis) and a university.
 * Uses a deterministic weighted scoring system.
 * 
 * Weights:
 * Domain compatibility       → 30%
 * Research-area match        → 25%
 * Expertise match            → 20%
 * Discipline match           → 15%
 * Location relevance         → 10%
 */
export function calculateUniversityMatch(
  challenge: Challenge,
  aiAnalysis: AIChallengeAnalysis,
  universityUser: User
): Omit<UniversityMatch, '_id' | 'createdAt' | 'updatedAt' | 'status'> {
  const profile = universityUser.universityProfile;
  if (!profile) {
    throw new Error("User does not have a university profile");
  }

  const reasons: string[] = [];
  const matchedDomains: string[] = [];
  const matchedResearchAreas: string[] = [];
  const matchedExpertise: string[] = [];
  
  let score = 0;

  const normalize = (s: string) => s.toLowerCase().trim();
  const includesText = (arr: string[], text: string) => 
    arr.some(item => normalize(item).includes(normalize(text)) || normalize(text).includes(normalize(item)));

  // 1. Domain compatibility (30%)
  const challengeDomain = normalize(challenge.domain);
  const aiDomain = normalize(aiAnalysis.suggestedDomain);
  
  const hasDomainMatch = profile.disciplines.some(d => normalize(d) === challengeDomain || normalize(d) === aiDomain) || 
                         profile.researchAreas.some(r => normalize(r) === challengeDomain || normalize(r) === aiDomain);

  if (hasDomainMatch) {
    score += 30;
    matchedDomains.push(challenge.domain);
    reasons.push(`Strong domain match in ${challenge.domain}.`);
  } else if (profile.disciplines.some(d => includesText([challengeDomain, aiDomain], d))) {
    score += 15; // Partial match
    matchedDomains.push(challenge.domain);
    reasons.push(`Partial domain match in ${challenge.domain}.`);
  }

  // 2. Research-area match (25%)
  // Compare AI routing signals & keywords with university research areas
  const aiKeywords = [...aiAnalysis.keywords, ...aiAnalysis.routingSignals];
  let researchMatches = 0;
  for (const keyword of aiKeywords) {
    if (includesText(profile.researchAreas, keyword)) {
      if (!matchedResearchAreas.includes(keyword)) {
        matchedResearchAreas.push(keyword);
        researchMatches++;
      }
    }
  }

  if (researchMatches > 0) {
    const researchScore = Math.min(25, researchMatches * 10);
    score += researchScore;
    reasons.push(`Research expertise aligns with ${matchedResearchAreas.slice(0, 3).join(', ')}.`);
  }

  // 3. Expertise match (20%)
  // Compare AI relevant expertise with university expertise
  let expertiseMatches = 0;
  for (const exp of aiAnalysis.relevantExpertise) {
    if (includesText(profile.expertise, exp)) {
      if (!matchedExpertise.includes(exp)) {
        matchedExpertise.push(exp);
        expertiseMatches++;
      }
    }
  }

  if (expertiseMatches > 0) {
    const expertiseScore = Math.min(20, expertiseMatches * 10);
    score += expertiseScore;
    reasons.push(`Relevant expertise in ${matchedExpertise.slice(0, 3).join(', ')}.`);
  }

  // 4. Discipline match (15%)
  let disciplineMatches = 0;
  for (const disc of aiAnalysis.requiredDisciplines) {
    if (includesText(profile.disciplines, disc)) {
      disciplineMatches++;
    }
  }
  if (disciplineMatches > 0) {
    score += 15;
    reasons.push(`University has required disciplines: ${aiAnalysis.requiredDisciplines.join(', ')}.`);
  }

  // 5. Location relevance (10%)
  let locationRelevance = "None";
  if (challenge.location.state && normalize(challenge.location.state) === normalize(profile.state)) {
    score += 10;
    locationRelevance = "Same State";
    reasons.push(`University is located in the same state (${profile.state}).`);
  } else if (aiAnalysis.geographicRelevance && includesText([aiAnalysis.geographicRelevance], profile.state)) {
    score += 5;
    locationRelevance = "Regionally relevant";
    reasons.push(`Geographically relevant to the challenge region.`);
  }

  // Calculate final confidence (just a normalized score representation 0-1)
  const confidence = Math.min(1, score / 100);

  if (reasons.length === 0) {
    reasons.push("No specific strong matches found, based on general university profile.");
  }

  return {
    challengeId: challenge.challengeId,
    universityId: universityUser._id as string,
    score,
    reasons,
    matchedDomains,
    matchedResearchAreas,
    matchedExpertise,
    locationRelevance,
    confidence
  };
}
