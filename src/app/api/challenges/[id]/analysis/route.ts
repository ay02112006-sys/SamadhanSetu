// src/app/api/challenges/[id]/analysis/route.ts
// GET the stored AI analysis for a challenge.
// Server-side only. Enforces auth + CITIZEN ownership.
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { Challenge } from '@/types/challenge';

/**
 * GET /api/challenges/[id]/analysis
 *
 * Returns the stored aiAnalysis sub-document for the challenge.
 * Requires: authenticated CITIZEN who owns the challenge.
 */
export async function GET(
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

  // ── 4. Return analysis ────────────────────────────────────────────────────
  if (!challenge.aiAnalysis) {
    return NextResponse.json(
      { success: true, data: null, message: 'No analysis available yet. Use POST /analyze to start.' },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true, data: challenge.aiAnalysis }, { status: 200 });
}
