// src/app/api/challenges/[id]/analyze/route.ts
// Server-side only. OPENAI_API_KEY is never sent to the client.
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { Challenge } from '@/types/challenge';
import { getAIProvider } from '@/lib/ai/getProvider';
import { notifyAIAnalysisCompleted } from '@/lib/notifications';
import { FallbackAIProvider } from '@/lib/ai/provider';
import { AIAnalysisStatus } from '@/types/ai-analysis';

/**
 * POST /api/challenges/[id]/analyze
 *
 * Security:   CITIZEN role + ownership enforced.
 * Concurrency: atomic findOneAndUpdate prevents double-processing.
 * Reuse:       returns existing COMPLETED analysis without re-running.
 * Retry:       FAILED analysis is re-run.
 * Fallback:    if real provider fails, deterministic fallback runs.
 * Validation:  both providers validate through aiRawResponseSchema.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'CITIZEN') {
    return NextResponse.json({ success: false, error: 'Forbidden: CITIZEN role required' }, { status: 403 });
  }

  // ── 2. Load challenge ─────────────────────────────────────────────────────
  const challengeId = params.id;
  let coll: Awaited<ReturnType<typeof getChallengeCollection>>;
  try {
    coll = await getChallengeCollection();
  } catch {
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 503 });
  }

  const challenge = (await coll.findOne({ challengeId })) as Challenge | null;
  if (!challenge) {
    return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
  }

  // ── 3. Ownership ──────────────────────────────────────────────────────────
  if (challenge.submittedBy !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden: not the challenge owner' }, { status: 403 });
  }

  // ── 4. Reuse completed analysis ───────────────────────────────────────────
  const existing = challenge.aiAnalysis;
  if (existing?.status === AIAnalysisStatus.COMPLETED || existing?.status === AIAnalysisStatus.FALLBACK) {
    return NextResponse.json({ success: true, data: existing }, { status: 200 });
  }

  // ── 5. Concurrent processing protection ───────────────────────────────────
  if (existing?.status === AIAnalysisStatus.PROCESSING) {
    return NextResponse.json(
      { success: true, data: existing, message: 'Analysis is already in progress' },
      { status: 202 }
    );
  }
  // Atomic: only proceed if not already PROCESSING (handles race conditions)
  const lockResult = await coll.findOneAndUpdate(
    {
      challengeId,
      $or: [
        { 'aiAnalysis.status': { $exists: false } },
        { aiAnalysis: null },
        { 'aiAnalysis.status': AIAnalysisStatus.FAILED },
        { 'aiAnalysis.status': AIAnalysisStatus.PENDING },
      ],
    },
    { $set: { 'aiAnalysis.status': AIAnalysisStatus.PROCESSING, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!lockResult) {
    // Another concurrent request already set PROCESSING
    const fresh = await coll.findOne({ challengeId });
    return NextResponse.json(
      { success: true, data: fresh?.aiAnalysis, message: 'Analysis already in progress' },
      { status: 202 }
    );
  }

  // ── 6. Run analysis with provider selection + fallback ────────────────────
  try {
    const provider = getAIProvider();
    const analysis = await provider.analyzeChallenge(challenge);
    // Persist — only aiAnalysis field is updated; original challenge data is untouched
    await coll.updateOne(
      { challengeId },
      { $set: { aiAnalysis: analysis, updatedAt: new Date() } }
    );
    // Phase 9: Send notification
    await notifyAIAnalysisCompleted(challenge.submittedBy, challengeId, challenge.title);
    return NextResponse.json({ success: true, data: analysis }, { status: 200 });
  } catch (providerError) {
    // Primary provider failed — attempt deterministic fallback
    console.error('[analyze] Primary provider error:', providerError);
    try {
      const fallback = new FallbackAIProvider();
      const fallbackAnalysis = await fallback.analyzeChallenge(challenge);
      await coll.updateOne(
        { challengeId },
        { $set: { aiAnalysis: fallbackAnalysis, updatedAt: new Date() } }
      );
      // Phase 9: Send notification
      await notifyAIAnalysisCompleted(challenge.submittedBy, challengeId, challenge.title);
      return NextResponse.json({ success: true, data: fallbackAnalysis }, { status: 200 });
    } catch (fallbackError) {
      // Fallback itself failed — mark as FAILED, do not persist corrupted data
      console.error('[analyze] Fallback provider error:', fallbackError);
      await coll.updateOne(
        { challengeId },
        {
          $set: {
            'aiAnalysis.status': AIAnalysisStatus.FAILED,
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json(
        { success: false, error: 'Analysis failed. You may retry.' },
        { status: 500 }
      );
    }
  }
}
