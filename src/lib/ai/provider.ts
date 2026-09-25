// src/lib/ai/provider.ts
// Server-side only — never import this from client components.
import { AIChallengeAnalysis, AIAnalysisStatus } from '@/types/ai-analysis';
import { Challenge, ChallengeDomain, ChallengePriority } from '@/types/challenge';
import { buildAIChallengeAnalysis, aiRawResponseSchema, AIRawResponse } from './types';

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/**
 * Abstract AI provider interface.
 * All implementations must analyzeChallenge and return AIChallengeAnalysis.
 */
export interface AIProvider {
  analyzeChallenge(challenge: Challenge): Promise<AIChallengeAnalysis>;
}

// ---------------------------------------------------------------------------
// OpenAI Provider  (real LLM, server-side only)
// ---------------------------------------------------------------------------

/**
 * Calls the OpenAI Chat Completions API using native fetch (no SDK required).
 * Reads OPENAI_API_KEY from process.env — never exposed to the client.
 * Returns a fully validated AIChallengeAnalysis via the shared Zod schema.
 */
export class OpenAIProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string = 'gpt-4o-mini';
  private readonly endpoint: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAIProvider: OPENAI_API_KEY is not set.');
    }
    this.apiKey = key;
  }

  async analyzeChallenge(challenge: Challenge): Promise<AIChallengeAnalysis> {
    const systemPrompt = `You are a civic-tech AI assistant. You analyze societal challenges submitted by citizens.
Return ONLY a JSON object — no markdown, no explanation, no surrounding text.

The JSON must have EXACTLY these fields:
{
  "suggestedDomain": string,         // one of: EDUCATION, HEALTHCARE, AGRICULTURE, WATER, SANITATION, ENVIRONMENT, RURAL_LIVELIHOODS, ACCESSIBILITY, URBAN_INFRASTRUCTURE, PUBLIC_SERVICES, OTHER
  "domainConfidence": number,        // 0-1
  "suggestedPriority": string,       // one of: LOW, MEDIUM, HIGH, CRITICAL
  "priorityConfidence": number,      // 0-1
  "problemSummary": string,          // concise 1-2 sentence summary
  "affectedPopulation": string,      // optional — who is affected
  "affectedPopulationEstimate": string, // optional — rough estimate
  "impactLevel": string,             // Low, Moderate, High, Critical
  "urgencyLevel": string,            // Low, Medium, High, Immediate
  "keyIssues": string[],             // top issues extracted
  "keywords": string[],              // 5-10 keywords
  "suggestedTags": string[],         // 3-6 short tags
  "possibleCauses": string[],        // 2-5 root causes
  "duplicateCandidates": [],         // always empty array — duplicate detection is done server-side
  "duplicateConfidence": 0,          // always 0 — duplicate detection is done server-side
  "routingSignals": string[],        // disciplines/entities to route to
  "requiredDisciplines": string[],   // academic disciplines
  "relevantExpertise": string[],     // specific expertise areas
  "geographicRelevance": string,     // optional — geographic scope
  "reasoning": string,               // 1-2 sentence explanation of decisions
  "modelProvider": "openai",
  "modelName": "${this.model}"
}`;

    const userMessage = `Analyze this societal challenge:

Title: ${challenge.title}
Domain (citizen-reported): ${challenge.domain}
Priority (citizen-reported): ${challenge.priority}
Description: ${challenge.description}
Location: ${[challenge.location.city, challenge.location.district, challenge.location.state].filter(Boolean).join(', ') || 'Not specified'}`;

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const json = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    // Parse JSON from model output
    let rawObj: unknown;
    try {
      rawObj = JSON.parse(content);
    } catch {
      throw new Error(`OpenAI returned invalid JSON: ${content.slice(0, 200)}`);
    }

    // Validate through shared Zod schema — throws ZodError on invalid output
    const validated: AIRawResponse = aiRawResponseSchema.parse(rawObj);

    // Merge server-side duplicate detection (duplicateCandidates from LLM are always [])
    const withDuplicates = await mergeServerDuplicates(validated, challenge);

    return buildAIChallengeAnalysis(withDuplicates, challenge.challengeId, AIAnalysisStatus.COMPLETED);
  }
}

// ---------------------------------------------------------------------------
// FallbackAIProvider  (deterministic, no external API)
// ---------------------------------------------------------------------------

/**
 * Deterministic fallback provider.
 * Performs keyword-based domain/priority inference and Jaccard duplicate detection.
 * Output passes through the same aiRawResponseSchema Zod validation as OpenAIProvider.
 */
export class FallbackAIProvider implements AIProvider {
  async analyzeChallenge(challenge: Challenge): Promise<AIChallengeAnalysis> {
    const description = challenge.description.toLowerCase();

    const inferredDomain = inferDomain(challenge.domain, description);
    const inferredPriority = inferPriority(challenge.priority, description);

    // Duplicate detection: Jaccard similarity on word sets against all existing challenges.
    const topDupes = await detectDuplicates(challenge);
    const duplicateConfidence = topDupes.length > 0 ? topDupes[0].similarityScore : 0;

    const raw: AIRawResponse = {
      suggestedDomain: inferredDomain,
      domainConfidence: inferredDomain !== 'OTHER' ? 0.75 : 0.5,
      suggestedPriority: inferredPriority,
      priorityConfidence: 0.7,
      problemSummary: challenge.description.slice(0, 200),
      affectedPopulation: undefined,
      affectedPopulationEstimate: undefined,
      impactLevel: 'Moderate',
      urgencyLevel: 'Medium',
      keyIssues: [],
      keywords: [],
      suggestedTags: [],
      possibleCauses: [],
      duplicateCandidates: topDupes,
      duplicateConfidence,
      routingSignals: [],
      requiredDisciplines: [],
      relevantExpertise: [],
      geographicRelevance: undefined,
      reasoning: 'Fallback deterministic analysis with keyword inference and duplicate detection.',
      modelProvider: 'fallback',
      modelName: 'deterministic',
    };

    // Validate through the same shared Zod schema — no bypassing validation
    const validated: AIRawResponse = aiRawResponseSchema.parse(raw);

    return buildAIChallengeAnalysis(validated, challenge.challengeId, AIAnalysisStatus.FALLBACK);
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  EDUCATION: ['school', 'education', 'teacher', 'student', 'learning', 'university', 'college'],
  HEALTHCARE: ['health', 'hospital', 'clinic', 'disease', 'medicine', 'doctor', 'patient'],
  AGRICULTURE: ['farmer', 'crop', 'soil', 'agri', 'farm', 'harvest', 'irrigation'],
  WATER: ['water', 'drought', 'flood', 'drinking water', 'pipeline'],
  SANITATION: ['sanitation', 'hygiene', 'toilet', 'sewage', 'waste'],
  ENVIRONMENT: ['environment', 'climate', 'pollution', 'pollutant', 'tree', 'deforestation'],
  RURAL_LIVELIHOODS: ['rural', 'livelihood', 'village', 'poverty', 'employment'],
  ACCESSIBILITY: ['accessibility', 'disabled', 'wheelchair', 'handicap', 'barrier'],
  URBAN_INFRASTRUCTURE: ['road', 'traffic', 'bridge', 'urban', 'pothole', 'transport'],
  PUBLIC_SERVICES: ['public', 'service', 'government', 'bureaucracy', 'administration'],
};

const PRIORITY_KEYWORDS: Record<string, string[]> = {
  CRITICAL: ['critical', 'life-threatening', 'emergency', 'life or death'],
  HIGH: ['urgent', 'asap', 'immediate', 'serious'],
  MEDIUM: ['important', 'needs', 'concern', 'moderate'],
  LOW: ['nice to have', 'optional', 'minor', 'slight'],
};

function inferDomain(existing: ChallengeDomain, description: string): string {
  for (const [dom, words] of Object.entries(DOMAIN_KEYWORDS)) {
    if (words.some((w) => description.includes(w))) {
      return dom;
    }
  }
  return existing ?? 'OTHER';
}

function inferPriority(existing: ChallengePriority, description: string): string {
  for (const [pri, words] of Object.entries(PRIORITY_KEYWORDS)) {
    if (words.some((w) => description.includes(w))) {
      return pri;
    }
  }
  return existing ?? 'MEDIUM';
}

function getWordSet(text: string): Set<string> {
  const matches = text.toLowerCase().match(/\b\w+\b/g);
  return new Set(matches ?? []);
}

async function detectDuplicates(
  challenge: Challenge
): Promise<Array<{ challengeId: string; similarityScore: number; reason: string }>> {
  const currentSet = getWordSet(challenge.description);
  const coll = await import('@/lib/challenge').then((m) => m.getChallengeCollection());
  const others = await coll.find({ challengeId: { $ne: challenge.challengeId } }).toArray();

  const scored: Array<{ challengeId: string; similarityScore: number; reason: string }> = [];

  for (const other of others) {
    const otherSet = getWordSet(other.description);
    const intersection = new Set([...currentSet].filter((x) => otherSet.has(x)));
    const union = new Set([...currentSet, ...otherSet]);
    const similarity = union.size === 0 ? 0 : intersection.size / union.size;
    if (similarity > 0.3) {
      scored.push({
        challengeId: other.challengeId,
        similarityScore: Number(similarity.toFixed(2)),
        reason: 'Description overlap (Jaccard)',
      });
    }
  }

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, 3);
}

/**
 * Merges server-computed duplicate candidates into an LLM-validated raw response.
 * LLM always returns empty duplicateCandidates; we fill them in server-side.
 */
async function mergeServerDuplicates(
  validated: AIRawResponse,
  challenge: Challenge
): Promise<AIRawResponse> {
  const topDupes = await detectDuplicates(challenge);
  return {
    ...validated,
    duplicateCandidates: topDupes,
    duplicateConfidence: topDupes.length > 0 ? topDupes[0].similarityScore : 0,
  };
}
