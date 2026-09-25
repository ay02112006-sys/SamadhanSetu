// src/lib/ai/types.ts
import { z } from 'zod';
import { AIAnalysisStatus } from '../../types/ai-analysis';

/**
 * Zod schema to validate raw AI provider response.
 * All numeric confidences are expected between 0 and 1.
 */
export const aiRawResponseSchema = z.object({
  suggestedDomain: z.string(),
  domainConfidence: z.number().min(0).max(1),
  suggestedPriority: z.string(),
  priorityConfidence: z.number().min(0).max(1),
  problemSummary: z.string(),
  affectedPopulation: z.string().optional(),
  affectedPopulationEstimate: z.string().optional(),
  impactLevel: z.string(),
  urgencyLevel: z.string(),
  keyIssues: z.array(z.string()),
  keywords: z.array(z.string()),
  suggestedTags: z.array(z.string()),
  possibleCauses: z.array(z.string()),
  duplicateCandidates: z.array(
    z.object({
      challengeId: z.string(),
      similarityScore: z.number().min(0).max(1),
      reason: z.string(),
    })
  ),
  duplicateConfidence: z.number().min(0).max(1),
  routingSignals: z.array(z.string()),
  requiredDisciplines: z.array(z.string()),
  relevantExpertise: z.array(z.string()),
  geographicRelevance: z.string().optional(),
  reasoning: z.string(),
  modelProvider: z.string().optional(),
  modelName: z.string().optional(),
});

export type AIRawResponse = z.infer<typeof aiRawResponseSchema>;

export const buildAIChallengeAnalysis = (
  raw: AIRawResponse,
  challengeId: string,
  status: AIAnalysisStatus = AIAnalysisStatus.COMPLETED
) => {
  const now = new Date();
  return {
    analysisId: `${challengeId}-analysis-${now.getTime()}`,
    challengeId,
    suggestedDomain: raw.suggestedDomain,
    domainConfidence: raw.domainConfidence,
    suggestedPriority: raw.suggestedPriority,
    priorityConfidence: raw.priorityConfidence,
    problemSummary: raw.problemSummary,
    affectedPopulation: raw.affectedPopulation,
    affectedPopulationEstimate: raw.affectedPopulationEstimate,
    impactLevel: raw.impactLevel,
    urgencyLevel: raw.urgencyLevel,
    keyIssues: raw.keyIssues,
    keywords: raw.keywords,
    suggestedTags: raw.suggestedTags,
    possibleCauses: raw.possibleCauses,
    duplicateCandidates: raw.duplicateCandidates,
    duplicateConfidence: raw.duplicateConfidence,
    routingSignals: raw.routingSignals,
    requiredDisciplines: raw.requiredDisciplines,
    relevantExpertise: raw.relevantExpertise,
    geographicRelevance: raw.geographicRelevance,
    reasoning: raw.reasoning,
    modelProvider: raw.modelProvider,
    modelName: raw.modelName,
    status,
    analyzedAt: now,
    updatedAt: now,
  } as const;
};
